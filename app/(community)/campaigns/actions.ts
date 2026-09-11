"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  canSeeHubCampaign,
  clearHubCampaignMemberWork,
  getUserCampaignAudience,
  hubCampaignJoinBlockReason,
  isHubCampaignTaskForMember,
} from "@/lib/hubCampaigns";
import { claimNextOpenInterviewSlot } from "@/lib/hubCampaignSlots";

async function requireMember() {
  if (!hubHas("hubCampaigns")) {
    throw new Error("Hub campaigns are not enabled");
  }
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE") {
    throw new Error("Not authorized");
  }
  return dbUser;
}

function revalidateCampaign(campaignId: string) {
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/home");
  revalidatePath(`/admin/hub-campaigns/${campaignId}`);
  revalidatePath("/admin/hub-campaigns");
}

export async function joinHubCampaign(campaignId: string) {
  const user = await requireMember();
  const audience = await getUserCampaignAudience(user.id);
  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: campaignId },
    include: { _count: { select: { signups: true } } },
  });
  if (!campaign) throw new Error("Campaign not found");

  const existing = await prisma.hubCampaignSignup.findUnique({
    where: { campaignId_userId: { campaignId, userId: user.id } },
  });
  const isAdmin = isAdminRole(user.role);
  if (
    !canSeeHubCampaign(campaign, { isAdmin, signedUp: !!existing, audience })
  ) {
    throw new Error("You cannot join this campaign");
  }
  const joinBlock = hubCampaignJoinBlockReason(campaign, {
    isAdmin,
    signedUp: !!existing,
    signupCount: campaign._count.signups,
    audience,
  });
  if (joinBlock) throw new Error(joinBlock);

  if (campaign.category === "INTERVIEWS") {
    try {
      await prisma.$transaction(async (tx) => {
        await claimNextOpenInterviewSlot(tx, {
          campaignId,
          userId: user.id,
          existingSignupId: existing?.id,
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes("spots")) throw err;
      throw new Error("That spot was just taken. Try again.");
    }
    revalidateCampaign(campaignId);
    return;
  }

  await prisma.hubCampaignSignup.upsert({
    where: { campaignId_userId: { campaignId, userId: user.id } },
    update: {},
    create: { campaignId, userId: user.id },
  });
  revalidateCampaign(campaignId);
}

export async function joinHubCampaignSlot(campaignId: string, slotId: string) {
  const user = await requireMember();
  const audience = await getUserCampaignAudience(user.id);
  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: campaignId },
    include: { _count: { select: { signups: true } } },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.category !== "INTERVIEWS") {
    throw new Error("This campaign does not use interview times");
  }

  const existing = await prisma.hubCampaignSignup.findUnique({
    where: { campaignId_userId: { campaignId, userId: user.id } },
  });
  const isAdmin = isAdminRole(user.role);
  if (
    !canSeeHubCampaign(campaign, { isAdmin, signedUp: !!existing, audience })
  ) {
    throw new Error("You cannot join this campaign");
  }
  const joiningFresh = !existing;
  if (joiningFresh) {
    const joinBlock = hubCampaignJoinBlockReason(campaign, {
      isAdmin,
      signedUp: false,
      signupCount: campaign._count.signups,
      audience,
    });
    if (joinBlock) throw new Error(joinBlock);
  }
  if (existing && campaign.status === "ARCHIVED" && !isAdmin) {
    throw new Error("This campaign is archived");
  }

  const slot = await prisma.hubCampaignSlot.findFirst({
    where: { id: slotId, campaignId },
    include: { signup: { select: { userId: true } } },
  });
  if (!slot) throw new Error("That time is no longer available");
  if (slot.signup && slot.signup.userId !== user.id) {
    throw new Error("Someone already booked that time");
  }
  if (slot.startsAt.getTime() < Date.now()) {
    throw new Error("That time has already passed");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const taken = await tx.hubCampaignSignup.findUnique({
        where: { slotId: slot.id },
        select: { userId: true },
      });
      if (taken && taken.userId !== user.id) {
        throw new Error("Someone already booked that time");
      }
      if (existing) {
        await tx.hubCampaignSignup.update({
          where: { id: existing.id },
          data: { slotId: slot.id },
        });
        return;
      }
      await tx.hubCampaignSignup.create({
        data: { campaignId, userId: user.id, slotId: slot.id },
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message === "Someone already booked that time" ||
        err.message.startsWith("This campaign") ||
        err.message.startsWith("You're already") ||
        err.message.startsWith("You're not")
      ) {
        throw err;
      }
    }
    throw new Error("That time was just taken. Pick another.");
  }
  revalidateCampaign(campaignId);
}

export async function leaveHubCampaign(campaignId: string) {
  const user = await requireMember();
  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "ARCHIVED" && !isAdminRole(user.role)) {
    throw new Error("This campaign is archived");
  }

  await prisma.$transaction(async (tx) => {
    await tx.hubCampaignSignup.deleteMany({
      where: { campaignId, userId: user.id },
    });
  });
  await clearHubCampaignMemberWork(campaignId, user.id);
  revalidateCampaign(campaignId);
}

export async function toggleHubCampaignTask(taskId: string) {
  const user = await requireMember();
  const task = await prisma.hubCampaignTask.findUnique({
    where: { id: taskId },
    include: {
      campaign: {
        select: {
          id: true,
          status: true,
          audienceType: true,
          audienceTagId: true,
          audienceBadgeId: true,
          signups: { where: { userId: user.id }, select: { id: true } },
        },
      },
    },
  });
  if (!task) throw new Error("Task not found");

  const isAdmin = isAdminRole(user.role);
  const signedUp = task.campaign.signups.length > 0;
  if (!isAdmin && !signedUp) {
    throw new Error("Join this campaign to update tasks");
  }
  if (task.campaign.status === "ARCHIVED") {
    throw new Error("This campaign is archived");
  }
  if (!isAdmin && !isHubCampaignTaskForMember(task, user.id)) {
    throw new Error("That task is assigned to someone else");
  }

  const existing = await prisma.hubCampaignTaskCompletion.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
  });
  if (existing) {
    await prisma.hubCampaignTaskCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.hubCampaignTaskCompletion.create({
      data: { taskId, userId: user.id },
    });
  }
  revalidateCampaign(task.campaign.id);
}

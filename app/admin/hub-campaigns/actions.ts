"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { HubCampaignAudienceType, HubCampaignStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  hubCampaignInterviewCreateSchema,
  hubCampaignSchema,
  hubCampaignSlotSchema,
  hubCampaignTaskSchema,
} from "@/lib/validations/hubCampaign";
import { formTimeZone, parseZonedDateTime } from "@/lib/time";
import { clearHubCampaignMemberWork } from "@/lib/hubCampaigns";
import {
  claimNextOpenInterviewSlot,
  createInterviewSlotBatch,
} from "@/lib/hubCampaignSlots";

async function requireAdmin() {
  if (!hubHas("hubCampaigns")) {
    throw new Error("Hub campaigns are not enabled");
  }
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, id: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return {
    ...session,
    user: { ...session.user, id: dbUser.id, role: dbUser.role, status: dbUser.status },
  };
}

function revalidateCampaign(campaignId?: string) {
  revalidatePath("/admin/hub-campaigns");
  revalidatePath("/campaigns");
  revalidatePath("/home");
  if (campaignId) {
    revalidatePath(`/admin/hub-campaigns/${campaignId}`);
    revalidatePath(`/campaigns/${campaignId}`);
  }
}

function parseOptionalDate(value: string | undefined, timeZone: string | null, label: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  return parseZonedDateTime(trimmed, timeZone, label);
}

function parseCampaignForm(formData: FormData) {
  const parsed = hubCampaignSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    status: formData.get("status") || "OPEN",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    location: formData.get("location"),
    audienceType: formData.get("audienceType") || "ALL_MEMBERS",
    audienceTagId: formData.get("audienceTagId"),
    audienceBadgeId: formData.get("audienceBadgeId"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid campaign");
  }

  const timeZone = formTimeZone(formData);
  const startsAt = parseOptionalDate(parsed.data.startsAt, timeZone, "start time");
  const endsAt = parseOptionalDate(parsed.data.endsAt, timeZone, "end time");
  if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new Error("End time must be after the start time");
  }

  const audienceType = parsed.data.audienceType as HubCampaignAudienceType;
  const capacityRaw = parsed.data.capacity?.trim();

  return {
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    category: parsed.data.category,
    status: (parsed.data.status || "OPEN") as HubCampaignStatus,
    startsAt,
    endsAt,
    location: parsed.data.location?.trim() || null,
    audienceType,
    audienceTagId: audienceType === "TAG" ? parsed.data.audienceTagId || null : null,
    audienceBadgeId: audienceType === "BADGE" ? parsed.data.audienceBadgeId || null : null,
    capacity: capacityRaw ? Number(capacityRaw) : null,
  };
}

export async function createHubCampaign(formData: FormData) {
  const session = await requireAdmin();
  const data = parseCampaignForm(formData);

  let interviewBatch: {
    startsAt: Date;
    endsAt: Date;
    network: string;
    count: number;
  } | null = null;

  if (data.category === "INTERVIEWS") {
    if (!data.startsAt) throw new Error("Set the interview time");
    const parsed = hubCampaignInterviewCreateSchema.safeParse({
      network: formData.get("interviewNetwork"),
      slotCount: formData.get("interviewSlotCount") || "8",
      durationMins: formData.get("interviewDurationMins") || "60",
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Set network and how many spots");
    }
    const fromDuration = new Date(
      data.startsAt.getTime() + parsed.data.durationMins * 60_000
    );
    const endsAt =
      data.endsAt && data.endsAt.getTime() > data.startsAt.getTime()
        ? data.endsAt
        : fromDuration;
    interviewBatch = {
      startsAt: data.startsAt,
      endsAt,
      network: parsed.data.network,
      count: parsed.data.slotCount,
    };
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const created = await tx.hubCampaign.create({
      data: {
        ...data,
        createdById: session.user.id,
      },
    });
    if (interviewBatch) {
      await createInterviewSlotBatch(tx, {
        campaignId: created.id,
        ...interviewBatch,
      });
    }
    return created;
  });

  revalidateCampaign(campaign.id);
  redirect(`/admin/hub-campaigns/${campaign.id}`);
}

export async function updateHubCampaign(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing campaign");
  const data = parseCampaignForm(formData);
  const payload =
    data.category === "INTERVIEWS"
      ? {
          title: data.title,
          description: data.description,
          category: data.category,
          status: data.status,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          location: data.location,
          audienceType: data.audienceType,
          audienceTagId: data.audienceTagId,
          audienceBadgeId: data.audienceBadgeId,
        }
      : data;

  await prisma.hubCampaign.update({
    where: { id },
    data: payload,
  });

  revalidateCampaign(id);
}

export async function archiveHubCampaign(campaignId: string) {
  await requireAdmin();
  await prisma.hubCampaign.update({
    where: { id: campaignId },
    data: { status: "ARCHIVED" },
  });
  revalidateCampaign(campaignId);
  redirect("/admin/hub-campaigns");
}

export async function setHubCampaignSignup(
  campaignId: string,
  userId: string,
  added: boolean
) {
  await requireAdmin();
  if (added) {
    const campaign = await prisma.hubCampaign.findUnique({
      where: { id: campaignId },
      select: { capacity: true, category: true, _count: { select: { signups: true } } },
    });
    if (!campaign) throw new Error("Campaign not found");
    const existing = await prisma.hubCampaignSignup.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (
      !existing &&
      campaign.capacity != null &&
      campaign._count.signups >= campaign.capacity
    ) {
      throw new Error("This campaign is full");
    }
    if (campaign.category === "INTERVIEWS" && !existing) {
      await prisma.$transaction(async (tx) => {
        const posted = await tx.hubCampaignSlot.count({ where: { campaignId } });
        if (posted > 0) {
          await claimNextOpenInterviewSlot(tx, { campaignId, userId });
          return;
        }
        await tx.hubCampaignSignup.create({ data: { campaignId, userId } });
      });
    } else {
      await prisma.hubCampaignSignup.upsert({
        where: { campaignId_userId: { campaignId, userId } },
        update: {},
        create: { campaignId, userId },
      });
    }
  } else {
    await prisma.hubCampaignSignup.deleteMany({ where: { campaignId, userId } });
    await clearHubCampaignMemberWork(campaignId, userId);
  }
  revalidateCampaign(campaignId);
}

export async function createHubCampaignSlot(campaignId: string, formData: FormData) {
  await requireAdmin();
  const campaign = await prisma.hubCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, category: true },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.category !== "INTERVIEWS") {
    throw new Error("Time slots are only for Interview campaigns");
  }

  const parsed = hubCampaignSlotSchema.safeParse({
    startsAt: formData.get("startsAt"),
    durationMins: formData.get("durationMins") || "60",
    network: formData.get("network"),
    slotCount: formData.get("slotCount") || "1",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid interview spots");
  }

  const zone = formTimeZone(formData);
  const startsAt = parseZonedDateTime(parsed.data.startsAt, zone, "interview time");
  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMins * 60_000);

  await prisma.$transaction(async (tx) => {
    await createInterviewSlotBatch(tx, {
      campaignId,
      startsAt,
      endsAt,
      network: parsed.data.network,
      count: parsed.data.slotCount,
    });
  });
  revalidateCampaign(campaignId);
}

export async function deleteHubCampaignSlot(slotId: string) {
  await requireAdmin();
  const slot = await prisma.hubCampaignSlot.findUnique({
    where: { id: slotId },
    include: { signup: { select: { id: true } } },
  });
  if (!slot) throw new Error("Slot not found");
  if (slot.signup) {
    throw new Error("Remove the member from this time before deleting the slot");
  }
  await prisma.hubCampaignSlot.delete({ where: { id: slotId } });
  const remaining = await prisma.hubCampaignSlot.count({
    where: { campaignId: slot.campaignId },
  });
  await prisma.hubCampaign.update({
    where: { id: slot.campaignId },
    data: { capacity: remaining },
  });
  revalidateCampaign(slot.campaignId);
}

export async function createHubCampaignTask(campaignId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsed = hubCampaignTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid task");
  }

  const last = await prisma.hubCampaignTask.findFirst({
    where: { campaignId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.hubCampaignTask.create({
    data: {
      campaignId,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      assigneeId: parsed.data.assigneeId || null,
      createdById: session.user.id,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidateCampaign(campaignId);
}

export async function updateHubCampaignTask(taskId: string, formData: FormData) {
  await requireAdmin();
  const parsed = hubCampaignTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid task");
  }

  const task = await prisma.hubCampaignTask.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      assigneeId: parsed.data.assigneeId || null,
    },
    select: { campaignId: true },
  });

  revalidateCampaign(task.campaignId);
}

export async function setHubCampaignTaskStatus(taskId: string, status: "TODO" | "DONE") {
  await requireAdmin();
  const task = await prisma.hubCampaignTask.update({
    where: { id: taskId },
    data: { status },
    select: { campaignId: true },
  });
  revalidateCampaign(task.campaignId);
}

export async function deleteHubCampaignTask(taskId: string) {
  await requireAdmin();
  const task = await prisma.hubCampaignTask.delete({
    where: { id: taskId },
    select: { campaignId: true },
  });
  revalidateCampaign(task.campaignId);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  CampaignActionType,
  CampaignAudienceType,
  CampaignTriggerType,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { parseTriggerConfig } from "@/lib/campaigns/types";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

const TRIGGERS: CampaignTriggerType[] = [
  "FIRST_LOGIN",
  "MEMBER_JOINED",
  "APPLICATION_APPROVED",
  "TAG_ADDED",
  "LEVEL_REACHED",
  "WENT_LIVE",
  "INACTIVE_DAYS",
  "NEVER_LOGGED_IN",
  "DAYS_AFTER_FIRST_LOGIN",
];

const ACTION_TYPES: CampaignActionType[] = ["EMAIL", "HUB_NOTIFY", "ADMIN_NOTIFY"];
const AUDIENCES: CampaignAudienceType[] = ["ALL_MEMBERS", "TAG", "GROUP", "NETWORK_TRACK"];

type ActionInput = {
  type: CampaignActionType;
  emailSubject?: string;
  emailBodyText?: string;
  notifyTitle?: string;
  notifyBody?: string;
  notifyHref?: string;
};

function parseActions(raw: string): ActionInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Campaign actions were invalid.");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Add at least one action (email or notification).");
  }
  const actions: ActionInput[] = [];
  for (const row of parsed.slice(0, 8)) {
    if (!row || typeof row !== "object") continue;
    const type = (row as { type?: string }).type;
    if (!type || !ACTION_TYPES.includes(type as CampaignActionType)) continue;
    const action: ActionInput = { type: type as CampaignActionType };
    if (action.type === "EMAIL") {
      action.emailSubject = String((row as { emailSubject?: string }).emailSubject || "").trim();
      action.emailBodyText = String((row as { emailBodyText?: string }).emailBodyText || "").trim();
      if (!action.emailSubject || !action.emailBodyText) {
        throw new Error("Email actions need a subject and body.");
      }
    } else {
      action.notifyTitle = String((row as { notifyTitle?: string }).notifyTitle || "").trim();
      action.notifyBody = String((row as { notifyBody?: string }).notifyBody || "").trim();
      action.notifyHref = String((row as { notifyHref?: string }).notifyHref || "").trim() || undefined;
      if (!action.notifyTitle || !action.notifyBody) {
        throw new Error("Notification actions need a title and message.");
      }
    }
    actions.push(action);
  }
  if (actions.length === 0) throw new Error("Add at least one action (email or notification).");
  return actions;
}

function parseCampaignForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) throw new Error("Give the campaign a name.");
  const description = String(formData.get("description") || "").trim() || null;
  const enabled = formData.get("enabled") === "on";
  const triggerType = String(formData.get("triggerType") || "") as CampaignTriggerType;
  if (!TRIGGERS.includes(triggerType)) throw new Error("Pick a trigger.");
  const audienceType = String(formData.get("audienceType") || "ALL_MEMBERS") as CampaignAudienceType;
  if (!AUDIENCES.includes(audienceType)) throw new Error("Pick an audience.");
  const oncePerUser = formData.get("oncePerUser") !== "off";

  const triggerConfig = parseTriggerConfig({
    days: formData.get("days"),
    tagId: String(formData.get("triggerTagId") || ""),
    levelId: String(formData.get("triggerLevelId") || ""),
  });

  const audienceTagId =
    audienceType === "TAG" ? String(formData.get("audienceTagId") || "") || null : null;
  const audienceGroupId =
    audienceType === "GROUP" ? String(formData.get("audienceGroupId") || "") || null : null;
  const audienceTrack =
    audienceType === "NETWORK_TRACK"
      ? String(formData.get("audienceTrack") || "CN") === "MN"
        ? "MN"
        : "CN"
      : null;

  if (audienceType === "TAG" && !audienceTagId) throw new Error("Pick a tag for the audience.");
  if (audienceType === "GROUP" && !audienceGroupId) throw new Error("Pick a group for the audience.");

  const timed =
    triggerType === "INACTIVE_DAYS" ||
    triggerType === "NEVER_LOGGED_IN" ||
    triggerType === "DAYS_AFTER_FIRST_LOGIN";
  if (timed && !triggerConfig.days) throw new Error("Enter how many days for this trigger.");

  const actions = parseActions(String(formData.get("actionsJson") || "[]"));

  return {
    name,
    description,
    enabled,
    triggerType,
    triggerConfig,
    audienceType,
    audienceTagId,
    audienceGroupId,
    audienceTrack,
    oncePerUser,
    actions,
  };
}

export async function createCampaign(formData: FormData) {
  const session = await requireAdmin();
  const data = parseCampaignForm(formData);
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled,
      triggerType: data.triggerType,
      triggerConfig: data.triggerConfig,
      audienceType: data.audienceType,
      audienceTagId: data.audienceTagId,
      audienceGroupId: data.audienceGroupId,
      audienceTrack: data.audienceTrack,
      oncePerUser: data.oncePerUser,
      createdById: session.user.id,
      actions: {
        create: data.actions.map((action, index) => ({
          sortOrder: index,
          type: action.type,
          emailSubject: action.emailSubject || null,
          emailBodyText: action.emailBodyText || null,
          notifyTitle: action.notifyTitle || null,
          notifyBody: action.notifyBody || null,
          notifyHref: action.notifyHref || null,
        })),
      },
    },
  });
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${campaign.id}`);
}

export async function updateCampaign(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing campaign.");
  const data = parseCampaignForm(formData);
  await prisma.$transaction([
    prisma.campaignAction.deleteMany({ where: { campaignId: id } }),
    prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        triggerType: data.triggerType,
        triggerConfig: data.triggerConfig,
        audienceType: data.audienceType,
        audienceTagId: data.audienceTagId,
        audienceGroupId: data.audienceGroupId,
        audienceTrack: data.audienceTrack,
        oncePerUser: data.oncePerUser,
        actions: {
          create: data.actions.map((action, index) => ({
            sortOrder: index,
            type: action.type,
            emailSubject: action.emailSubject || null,
            emailBodyText: action.emailBodyText || null,
            notifyTitle: action.notifyTitle || null,
            notifyBody: action.notifyBody || null,
            notifyHref: action.notifyHref || null,
          })),
        },
      },
    }),
  ]);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(`/admin/campaigns/${id}`);
}

export async function setCampaignEnabled(campaignId: string, enabled: boolean) {
  await requireAdmin();
  await prisma.campaign.update({ where: { id: campaignId }, data: { enabled } });
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  await requireAdmin();
  await prisma.campaign.delete({ where: { id: campaignId } });
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

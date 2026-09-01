import "server-only";
import type {
  Campaign,
  CampaignAction,
  CampaignActionType,
  CampaignAudienceType,
  CampaignTriggerType,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { sendCampaignEmail, sendCampaignAdminNotifyEmail } from "@/lib/email";
import { button, SAMPLE_APP_URL } from "@/lib/emailLayout";
import { CN_TAG_NAME, MN_TAG_NAME, type NetworkTrack } from "@/lib/mnCn";
import { parseTriggerConfig, type CampaignTriggerConfig } from "./types";

export type CampaignEvent = {
  type: CampaignTriggerType;
  userId: string;
  payload?: {
    tagId?: string;
    levelId?: string;
    sessionId?: string;
  };
};

type CampaignWithActions = Campaign & { actions: CampaignAction[] };

type MemberForCampaign = {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  broadcastEmailsOptIn: boolean;
  firstLoginAt: Date | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  progressionProfile: { currentLevel: { name: string } | null } | null;
  tags: { tagId: string; tag: { name: string } }[];
  groupMemberships: { groupId: string; group: { name: string } }[];
  application: { answers: unknown } | null;
};

const MEMBER_STATUSES: UserStatus[] = ["ACTIVE", "INVITED"];

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || SAMPLE_APP_URL;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

function trackOf(user: MemberForCampaign): NetworkTrack | null {
  const names = new Set(
    [
      ...user.tags.map((t) => t.tag.name.toUpperCase()),
      ...user.groupMemberships.map((g) => g.group.name.toUpperCase()),
    ].filter(Boolean)
  );
  if (names.has("CN")) return "CN";
  if (names.has("MN")) return "MN";
  const answers = user.application?.answers;
  if (answers && typeof answers === "object") {
    const track = (answers as Record<string, unknown>).track;
    if (track === "CN" || track === "MN") return track;
  }
  return null;
}

function matchesAudience(campaign: Campaign, user: MemberForCampaign): boolean {
  if (!MEMBER_STATUSES.includes(user.status)) return false;
  if (campaign.audienceType === "TAG") {
    if (!campaign.audienceTagId) return false;
    return user.tags.some((t) => t.tagId === campaign.audienceTagId);
  }
  if (campaign.audienceType === "GROUP") {
    if (!campaign.audienceGroupId) return false;
    return user.groupMemberships.some((g) => g.groupId === campaign.audienceGroupId);
  }
  if (campaign.audienceType === "NETWORK_TRACK") {
    const want = campaign.audienceTrack === "MN" ? "MN" : "CN";
    return trackOf(user) === want;
  }
  return true;
}

function matchesTriggerConfig(
  type: CampaignTriggerType,
  config: CampaignTriggerConfig,
  event: CampaignEvent
): boolean {
  if (type === "TAG_ADDED" && config.tagId) {
    return event.payload?.tagId === config.tagId;
  }
  if (type === "LEVEL_REACHED" && config.levelId) {
    return event.payload?.levelId === config.levelId;
  }
  return true;
}

function buildTriggerKey(
  campaign: Campaign,
  config: CampaignTriggerConfig,
  event: CampaignEvent,
  now = new Date()
): string {
  if (campaign.oncePerUser) {
    if (event.type === "TAG_ADDED") return `tag:${event.payload?.tagId || config.tagId || "any"}`;
    if (event.type === "LEVEL_REACHED") {
      return `level:${event.payload?.levelId || config.levelId || "any"}`;
    }
    if (event.type === "WENT_LIVE") return "went-live";
    if (event.type === "INACTIVE_DAYS") return `inactive:${config.days || 7}`;
    if (event.type === "NEVER_LOGGED_IN") return `never:${config.days || 7}`;
    if (event.type === "DAYS_AFTER_FIRST_LOGIN") return `after-login:${config.days || 7}`;
    return event.type.toLowerCase();
  }

  if (event.type === "WENT_LIVE") return `live:${event.payload?.sessionId || now.toISOString()}`;
  if (event.type === "TAG_ADDED") {
    return `tag:${event.payload?.tagId || "any"}:${now.toISOString().slice(0, 10)}`;
  }
  if (event.type === "LEVEL_REACHED") {
    return `level:${event.payload?.levelId || "any"}:${now.toISOString().slice(0, 10)}`;
  }
  const week = isoWeekKey(now);
  return `${event.type.toLowerCase()}:${week}`;
}

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function loadMember(userId: string): Promise<MemberForCampaign | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      broadcastEmailsOptIn: true,
      firstLoginAt: true,
      lastLoginAt: true,
      lastSeenAt: true,
      createdAt: true,
      progressionProfile: { select: { currentLevel: { select: { name: true } } } },
      tags: { select: { tagId: true, tag: { select: { name: true } } } },
      groupMemberships: { select: { groupId: true, group: { select: { name: true } } } },
      application: { select: { answers: true } },
    },
  });
}

function varsFor(user: MemberForCampaign): Record<string, string> {
  const name = user.name || user.email.split("@")[0] || "there";
  const home = `${appUrl()}/home`;
  return {
    name,
    email: user.email,
    level: user.progressionProfile?.currentLevel?.name || "—",
    url: home,
    cta: button(home, "Open the hub"),
  };
}

async function createHubNotification(
  userId: string,
  title: string,
  body: string,
  href: string | null
) {
  await prisma.hubNotification.create({
    data: {
      userId,
      title: title.slice(0, 160),
      body: body.slice(0, 2000),
      href: href?.trim() || null,
    },
  });
}

async function runActions(campaign: CampaignWithActions, user: MemberForCampaign) {
  const vars = varsFor(user);
  const ordered = [...campaign.actions].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const action of ordered) {
    if (action.type === "EMAIL") {
      if (!user.broadcastEmailsOptIn) continue;
      const subject = interpolate(action.emailSubject || campaign.name, vars);
      const bodyText = interpolate(action.emailBodyText || "", vars);
      if (!subject.trim() || !bodyText.trim()) continue;
      await sendCampaignEmail(user.id, user.email, subject, bodyText, vars.cta);
    } else if (action.type === "HUB_NOTIFY") {
      const title = interpolate(action.notifyTitle || campaign.name, vars);
      const body = interpolate(action.notifyBody || "", vars);
      if (!title.trim()) continue;
      await createHubNotification(user.id, title, body, action.notifyHref || "/home");
    } else if (action.type === "ADMIN_NOTIFY") {
      const title = interpolate(action.notifyTitle || campaign.name, vars);
      const body = interpolate(
        action.notifyBody || `${vars.name} (${vars.email}) matched “${campaign.name}”.`,
        vars
      );
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", status: "ACTIVE", receivesAdminAlerts: true },
        select: { id: true, email: true },
      });
      for (const admin of admins) {
        await createHubNotification(
          admin.id,
          title,
          body,
          action.notifyHref || `/admin/users/${user.id}`
        );
      }
      const emails = await getAlertableAdminEmails();
      if (emails.length > 0) {
        await sendCampaignAdminNotifyEmail(emails, title, body, user.id);
      }
    }
  }
}

async function executeCampaign(
  campaign: CampaignWithActions,
  user: MemberForCampaign,
  triggerKey: string
) {
  try {
    await prisma.campaignRun.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        triggerKey,
        status: "SENT",
      },
    });
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "P2002") return;
    throw err;
  }

  try {
    await runActions(campaign, user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Campaign action failed";
    await prisma.campaignRun.updateMany({
      where: { campaignId: campaign.id, userId: user.id, triggerKey },
      data: { status: "FAILED", error: message.slice(0, 500) },
    });
    console.error(`campaign ${campaign.id} failed for ${user.id}:`, err);
  }
}

export async function fireCampaignEvent(event: CampaignEvent): Promise<void> {
  const campaigns = await prisma.campaign.findMany({
    where: { enabled: true, triggerType: event.type },
    include: { actions: { orderBy: { sortOrder: "asc" } } },
  });
  if (campaigns.length === 0) return;

  const user = await loadMember(event.userId);
  if (!user) return;

  for (const campaign of campaigns) {
    const config = parseTriggerConfig(campaign.triggerConfig);
    if (!matchesTriggerConfig(campaign.triggerType, config, event)) continue;
    if (!matchesAudience(campaign, user)) continue;
    const triggerKey = buildTriggerKey(campaign, config, event);
    await executeCampaign(campaign, user, triggerKey);
  }
}

/** Fire without blocking the caller (login, live poll, tag writes). */
export function fireCampaignEventSafe(event: CampaignEvent): void {
  void fireCampaignEvent(event).catch((err) => {
    console.error("campaign event failed:", event.type, event.userId, err);
  });
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function audienceWhere(campaign: Campaign): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = { status: { in: MEMBER_STATUSES } };

  if (campaign.audienceType === "TAG" && campaign.audienceTagId) {
    return { AND: [base, { tags: { some: { tagId: campaign.audienceTagId } } }] };
  }
  if (campaign.audienceType === "GROUP" && campaign.audienceGroupId) {
    return { AND: [base, { groupMemberships: { some: { groupId: campaign.audienceGroupId } } }] };
  }
  if (campaign.audienceType === "NETWORK_TRACK") {
    const name = campaign.audienceTrack === "MN" ? MN_TAG_NAME : CN_TAG_NAME;
    const track = campaign.audienceTrack === "MN" ? "MN" : "CN";
    return {
      AND: [
        base,
        {
          OR: [
            { tags: { some: { tag: { name: { equals: name, mode: "insensitive" } } } } },
            {
              groupMemberships: {
                some: { group: { name: { equals: name, mode: "insensitive" } } },
              },
            },
            { application: { is: { answers: { path: ["track"], equals: track } } } },
          ],
        },
      ],
    };
  }

  return base;
}

async function runTimedCampaign(campaign: CampaignWithActions): Promise<number> {
  const config = parseTriggerConfig(campaign.triggerConfig);
  const days = config.days || 7;
  const cutoff = daysAgo(days);
  const audience = audienceWhere(campaign);

  let extra: Prisma.UserWhereInput = {};
  if (campaign.triggerType === "INACTIVE_DAYS") {
    extra = {
      lastLoginAt: { not: null },
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lte: cutoff } }],
    };
  } else if (campaign.triggerType === "NEVER_LOGGED_IN") {
    extra = { lastLoginAt: null, createdAt: { lte: cutoff } };
  } else if (campaign.triggerType === "DAYS_AFTER_FIRST_LOGIN") {
    extra = { firstLoginAt: { not: null, lte: cutoff } };
  } else {
    return 0;
  }

  const users = await prisma.user.findMany({
    where: { AND: [audience, extra] },
    select: { id: true },
    take: 400,
  });

  let ran = 0;
  for (const row of users) {
    await fireCampaignEvent({ type: campaign.triggerType, userId: row.id });
    ran++;
  }
  return ran;
}

export async function runTimedCampaigns(): Promise<{ campaigns: number; evaluated: number }> {
  const campaigns = await prisma.campaign.findMany({
    where: {
      enabled: true,
      triggerType: { in: ["INACTIVE_DAYS", "NEVER_LOGGED_IN", "DAYS_AFTER_FIRST_LOGIN"] },
    },
    include: { actions: { orderBy: { sortOrder: "asc" } } },
  });

  let evaluated = 0;
  for (const campaign of campaigns) {
    evaluated += await runTimedCampaign(campaign);
  }
  return { campaigns: campaigns.length, evaluated };
}

export function actionTypeLabel(type: CampaignActionType): string {
  if (type === "EMAIL") return "Email member";
  if (type === "HUB_NOTIFY") return "Hub notification";
  return "Notify admins";
}

export function audienceTypeLabel(type: CampaignAudienceType): string {
  if (type === "TAG") return "Tag";
  if (type === "GROUP") return "Group";
  if (type === "NETWORK_TRACK") return "Track";
  return "Everyone";
}

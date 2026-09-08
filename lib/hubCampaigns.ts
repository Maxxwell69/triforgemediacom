import { notFound } from "next/navigation";
import type {
  HubCampaignAudienceType,
  HubCampaignCategory,
  HubCampaignStatus,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { isAdminRole } from "@/lib/rbac";

export const HUB_CAMPAIGN_CATEGORIES: {
  value: HubCampaignCategory;
  label: string;
  icon: string;
}[] = [
  { value: "INTERVIEWS", label: "Interviews", icon: "🎙️" },
  { value: "MEETING", label: "Meeting", icon: "📅" },
  { value: "GAMES", label: "Games", icon: "🎮" },
  { value: "BATTLES", label: "Battles", icon: "⚔️" },
];

export const HUB_CAMPAIGN_STATUSES: { value: HubCampaignStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ARCHIVED", label: "Archived" },
];

export const HUB_CAMPAIGN_AUDIENCES: {
  value: HubCampaignAudienceType;
  label: string;
}[] = [
  { value: "ALL_MEMBERS", label: "Everyone" },
  { value: "TAG", label: "Members with a tag" },
  { value: "BADGE", label: "Members with a badge" },
];

export function requireHubCampaignsModule() {
  if (!hubHas("hubCampaigns")) notFound();
}

export function hubCampaignCategoryMeta(category: HubCampaignCategory) {
  return (
    HUB_CAMPAIGN_CATEGORIES.find((c) => c.value === category) ?? {
      value: category,
      label: category,
      icon: "📌",
    }
  );
}

export function hubCampaignStatusLabel(status: HubCampaignStatus) {
  return HUB_CAMPAIGN_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export type HubCampaignAudienceKeys = {
  tagIds: Set<string>;
  badgeIds: Set<string>;
};

export async function getUserCampaignAudience(userId: string): Promise<HubCampaignAudienceKeys> {
  const [tags, badges] = await Promise.all([
    prisma.userTag.findMany({ where: { userId }, select: { tagId: true } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ]);
  return {
    tagIds: new Set(tags.map((t) => t.tagId)),
    badgeIds: new Set(badges.map((b) => b.badgeId)),
  };
}

export function isEligibleForHubCampaign(
  campaign: {
    audienceType: HubCampaignAudienceType;
    audienceTagId: string | null;
    audienceBadgeId: string | null;
  },
  audience: HubCampaignAudienceKeys
) {
  if (campaign.audienceType === "ALL_MEMBERS") return true;
  if (campaign.audienceType === "TAG") {
    return !!campaign.audienceTagId && audience.tagIds.has(campaign.audienceTagId);
  }
  if (campaign.audienceType === "BADGE") {
    return !!campaign.audienceBadgeId && audience.badgeIds.has(campaign.audienceBadgeId);
  }
  return false;
}

export function canSeeHubCampaign(
  campaign: {
    status: HubCampaignStatus;
    audienceType: HubCampaignAudienceType;
    audienceTagId: string | null;
    audienceBadgeId: string | null;
  },
  ctx: { isAdmin: boolean; signedUp: boolean; audience: HubCampaignAudienceKeys }
) {
  if (ctx.isAdmin) return campaign.status !== "ARCHIVED";
  if (campaign.status === "DRAFT" || campaign.status === "ARCHIVED") return false;
  if (ctx.signedUp) return true;
  return isEligibleForHubCampaign(campaign, ctx.audience);
}

export function canJoinHubCampaign(
  campaign: {
    status: HubCampaignStatus;
    capacity: number | null;
    audienceType: HubCampaignAudienceType;
    audienceTagId: string | null;
    audienceBadgeId: string | null;
  },
  ctx: {
    isAdmin: boolean;
    signedUp: boolean;
    signupCount: number;
    audience: HubCampaignAudienceKeys;
  }
) {
  if (ctx.signedUp) return false;
  if (campaign.status !== "OPEN") return false;
  if (!ctx.isAdmin && !isEligibleForHubCampaign(campaign, ctx.audience)) return false;
  if (campaign.capacity != null && ctx.signupCount >= campaign.capacity) return false;
  return true;
}

export const hubCampaignMemberSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  profile: { select: { socialLinks: true, username: true, showRealName: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export async function listVisibleHubCampaigns(userId: string, role: UserRole) {
  const isAdmin = isAdminRole(role);
  const audience = await getUserCampaignAudience(userId);
  const campaigns = await prisma.hubCampaign.findMany({
    where: isAdmin ? { status: { not: "ARCHIVED" } } : { status: { in: ["OPEN", "CLOSED"] } },
    orderBy: [{ status: "asc" }, { startsAt: "asc" }, { createdAt: "desc" }],
    include: {
      audienceTag: { select: { id: true, name: true, color: true } },
      audienceBadge: { select: { id: true, name: true } },
      _count: { select: { signups: true, tasks: true } },
      signups: { where: { userId }, select: { id: true } },
    },
  });

  return campaigns.filter((campaign) =>
    canSeeHubCampaign(campaign, {
      isAdmin,
      signedUp: campaign.signups.length > 0,
      audience,
    })
  );
}

export function audienceWhere(campaign: {
  audienceType: HubCampaignAudienceType;
  audienceTagId: string | null;
  audienceBadgeId: string | null;
}) {
  const base = { status: "ACTIVE" as const, hiddenFromDirectory: false };
  if (campaign.audienceType === "TAG" && campaign.audienceTagId) {
    return { ...base, tags: { some: { tagId: campaign.audienceTagId } } };
  }
  if (campaign.audienceType === "BADGE" && campaign.audienceBadgeId) {
    return { ...base, userBadges: { some: { badgeId: campaign.audienceBadgeId } } };
  }
  return base;
}

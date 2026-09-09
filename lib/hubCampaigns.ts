import { notFound } from "next/navigation";
import type { HubCampaignAudienceType, HubCampaignStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { isAdminRole } from "@/lib/rbac";

export {
  HUB_CAMPAIGN_AUDIENCES,
  HUB_CAMPAIGN_CATEGORIES,
  HUB_CAMPAIGN_STATUSES,
  hubCampaignCategoryMeta,
  hubCampaignStatusLabel,
  isInterviewCampaign,
} from "@/lib/hubCampaignLabels";

export function requireHubCampaignsModule() {
  if (!hubHas("hubCampaigns")) notFound();
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

import type { Platform } from "@prisma/client";

type MemberLike = {
  name: string | null;
  email?: string | null;
  profile?: {
    platform?: Platform;
    showRealName?: boolean | null;
    socialLinks?: unknown;
    username?: string | null;
  } | null;
  tiktokConnection?: { displayName: string | null; avatarUrl: string | null } | null;
  tiktokStatsSnapshot?: { nickname: string | null; avatarUrl: string | null; uniqueId?: string } | null;
};

function tiktokHandleFromSocialLinks(socialLinks: unknown): string | null {
  if (!socialLinks || typeof socialLinks !== "object") return null;
  const tiktok = (socialLinks as Record<string, unknown>).tiktok;
  if (typeof tiktok !== "string" || !tiktok) return null;
  const fromUrl = tiktok.match(/tiktok\.com\/@([\w.-]+)/i);
  if (fromUrl) return `@${fromUrl[1]}`;
  const bare = tiktok.trim().replace(/^@/, "");
  if (/^[\w.-]+$/.test(bare) && bare.length >= 2) return `@${bare}`;
  return null;
}

/** TikTok identity used as the default public display name. */
export function getTikTokUsername(member: MemberLike): string | null {
  const fromSnapshot = member.tiktokStatsSnapshot?.nickname?.trim();
  if (fromSnapshot) return fromSnapshot;
  const fromConnection = member.tiktokConnection?.displayName?.trim();
  if (fromConnection) return fromConnection;
  const uniqueId = member.tiktokStatsSnapshot?.uniqueId?.trim();
  if (uniqueId) return `@${uniqueId.replace(/^@/, "")}`;
  return tiktokHandleFromSocialLinks(member.profile?.socialLinks);
}

/**
 * Public display name across the community.
 * Default: TikTok username (stats nickname, OAuth display name, or @handle from profile link).
 * Opt-in: real account name when Profile.showRealName is true.
 */
export function getMemberDisplayName(member: MemberLike): string {
  if (member.profile?.showRealName) {
    return member.name?.trim() || getTikTokUsername(member) || "Unnamed";
  }
  return getTikTokUsername(member) || member.profile?.username?.trim() || member.name?.trim() || "Unnamed";
}

/**
 * Name shown in channel / DM / webinar chat.
 * Prefer TikTok identity, then hub username, then account name.
 * "Member" only when none of those exist.
 */
export function getChatDisplayName(member: MemberLike): string {
  return (
    getTikTokUsername(member) ||
    member.profile?.username?.trim() ||
    member.name?.trim() ||
    "Member"
  );
}

/** Prisma include fragment for resolving chat display names. */
export const chatAuthorSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  mutedUntil: true,
  profile: { select: { socialLinks: true, username: true, showRealName: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export function getMemberAvatarUrl(member: MemberLike): string | null {
  if (member.tiktokStatsSnapshot?.avatarUrl) {
    return member.tiktokStatsSnapshot.avatarUrl;
  }
  if (member.tiktokConnection?.avatarUrl) {
    return member.tiktokConnection.avatarUrl;
  }
  return null;
}

export function getMemberInitial(member: MemberLike): string {
  return getMemberDisplayName(member).trim().replace(/^@/, "").charAt(0).toUpperCase() || "?";
}

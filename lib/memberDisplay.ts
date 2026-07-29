import type { Platform } from "@prisma/client";

type MemberLike = {
  name: string | null;
  email?: string;
  profile?: {
    platform?: Platform;
    showRealName?: boolean | null;
    socialLinks?: unknown;
  } | null;
  tiktokConnection?: { displayName: string | null; avatarUrl: string | null } | null;
};

function tiktokHandleFromSocialLinks(socialLinks: unknown): string | null {
  if (!socialLinks || typeof socialLinks !== "object") return null;
  const tiktok = (socialLinks as Record<string, unknown>).tiktok;
  if (typeof tiktok !== "string" || !tiktok) return null;
  const match = tiktok.match(/@([\w.-]+)/);
  return match ? `@${match[1]}` : null;
}

/** TikTok identity used as the default public display name. */
export function getTikTokUsername(member: MemberLike): string | null {
  const fromConnection = member.tiktokConnection?.displayName?.trim();
  if (fromConnection) return fromConnection;
  return tiktokHandleFromSocialLinks(member.profile?.socialLinks);
}

/**
 * Public display name across the community.
 * Default: TikTok username (connection display name or @handle from profile link).
 * Opt-in: real account name when Profile.showRealName is true.
 */
export function getMemberDisplayName(member: MemberLike): string {
  if (member.profile?.showRealName) {
    return member.name?.trim() || getTikTokUsername(member) || "Unnamed";
  }
  return getTikTokUsername(member) || member.name?.trim() || "Unnamed";
}

export function getMemberAvatarUrl(member: MemberLike): string | null {
  if (member.tiktokConnection?.avatarUrl) {
    return member.tiktokConnection.avatarUrl;
  }
  return null;
}

export function getMemberInitial(member: MemberLike): string {
  return getMemberDisplayName(member).trim().replace(/^@/, "").charAt(0).toUpperCase() || "?";
}

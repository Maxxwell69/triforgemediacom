import type { Platform } from "@prisma/client";

type MemberLike = {
  name: string | null;
  email: string;
  profile?: { platform: Platform } | null;
  tiktokConnection?: { displayName: string | null; avatarUrl: string | null } | null;
};

/**
 * Members whose main platform is TikTok and who've connected their account
 * get their real TikTok display name/avatar shown across the community —
 * it's the identity they're actually known by there. Everyone else falls
 * back to their account name / initial.
 */
export function getMemberDisplayName(member: MemberLike): string {
  if (member.profile?.platform === "TIKTOK" && member.tiktokConnection?.displayName) {
    return member.tiktokConnection.displayName;
  }
  return member.name || "Unnamed";
}

export function getMemberAvatarUrl(member: MemberLike): string | null {
  if (member.profile?.platform === "TIKTOK" && member.tiktokConnection?.avatarUrl) {
    return member.tiktokConnection.avatarUrl;
  }
  return null;
}

export function getMemberInitial(member: MemberLike): string {
  return getMemberDisplayName(member).trim().charAt(0).toUpperCase() || "?";
}

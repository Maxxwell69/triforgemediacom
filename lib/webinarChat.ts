import "server-only";
import { webinarGuestIdentity } from "@/lib/webinarExternal";
import { displayNameForUser } from "@/lib/webinars";
import { getMemberAvatarUrl } from "@/lib/memberDisplay";

export const webinarChatAuthorSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  profile: { select: { socialLinks: true, username: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export const webinarChatGuestSelect = {
  id: true,
  name: true,
} as const;

/** Normalize hub-member or outside-guest authors into the chat UI shape. */
export function serializeWebinarChatAuthor(
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    profile: { socialLinks: unknown; username: string | null } | null;
    tiktokConnection: { displayName: string | null; avatarUrl: string | null } | null;
    tiktokStatsSnapshot: {
      nickname: string | null;
      avatarUrl: string | null;
      uniqueId: string | null;
    } | null;
  } | null | undefined,
  guest: { id: string; name: string } | null | undefined
): { id: string; name: string; image: string | null } {
  if (user) {
    const forDisplay = {
      name: user.name,
      email: user.email,
      profile: user.profile,
      tiktokConnection: user.tiktokConnection,
      tiktokStatsSnapshot: user.tiktokStatsSnapshot
        ? {
            nickname: user.tiktokStatsSnapshot.nickname,
            avatarUrl: user.tiktokStatsSnapshot.avatarUrl,
            uniqueId: user.tiktokStatsSnapshot.uniqueId ?? undefined,
          }
        : null,
    };
    return {
      id: user.id,
      name: displayNameForUser(forDisplay),
      image: getMemberAvatarUrl(forDisplay) || user.image,
    };
  }
  if (guest) {
    return {
      id: webinarGuestIdentity(guest.id),
      name: guest.name,
      image: null,
    };
  }
  return { id: "unknown", name: "Unknown", image: null };
}

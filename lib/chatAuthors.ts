import type { UserRole } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/rbac";
import { getChatDisplayName, getMemberAvatarUrl } from "@/lib/memberDisplay";

type AuthorRow = {
  id: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  mutedUntil: Date | null;
  email?: string | null;
  profile?: {
    socialLinks?: unknown;
    username?: string | null;
    showRealName?: boolean | null;
  } | null;
  tiktokConnection?: { displayName: string | null; avatarUrl: string | null } | null;
  tiktokStatsSnapshot?: { nickname: string | null; avatarUrl: string | null; uniqueId?: string } | null;
  progressionProfile?: { currentLevel: { name: string } | null } | null;
};

/** Flatten a Prisma user include into the shape ChatView / DM expect. */
export function toChatAuthor(user: AuthorRow) {
  return {
    id: user.id,
    name: getChatDisplayName(user),
    image: getMemberAvatarUrl(user) || user.image,
    role: user.role,
    mutedUntil: user.mutedUntil,
    progressionLevel: user.progressionProfile?.currentLevel?.name ?? null,
  };
}

/** Staff keep their role badge. Members show earned rank — never a stale Recruit label. */
export function chatRankLabel(role: UserRole, progressionLevel?: string | null): string | null {
  if (role === "ADMIN" || role === "MOD" || role === "CREATOR") return ROLE_LABELS[role];
  if (progressionLevel && progressionLevel !== "Recruit") return progressionLevel;
  return null;
}

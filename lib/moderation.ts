import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/rbac";

export function canModerate(role: UserRole | undefined | null): boolean {
  return isAdminRole(role);
}

/**
 * MOD/ADMIN moderation actions (mute, etc.) can only target MEMBER/CREATOR —
 * never another MOD or ADMIN.
 */
export function canBeModerationTarget(role: UserRole | undefined | null): boolean {
  return !isAdminRole(role);
}

export function isMuted(user: { mutedUntil: Date | null }): boolean {
  return !!user.mutedUntil && user.mutedUntil.getTime() > Date.now();
}

export const MUTE_DURATION_PRESETS_MINUTES = [10, 60, 1440, 10080] as const;
export const DEFAULT_MUTE_DURATION_MINUTES = 1440;

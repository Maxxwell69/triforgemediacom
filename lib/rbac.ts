import type { UserRole } from "@prisma/client";

export const ADMIN_ROLES: UserRole[] = ["ADMIN", "MOD"];

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

// Higher rank = more access. Used to gate Channel.minRole visibility.
const ROLE_RANK: Record<UserRole, number> = {
  MEMBER: 0,
  CREATOR: 1,
  MOD: 2,
  ADMIN: 3,
};

export function meetsMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MOD: "Mod",
  CREATOR: "Creator",
  MEMBER: "Member",
};

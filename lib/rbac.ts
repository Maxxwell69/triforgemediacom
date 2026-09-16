import type { UserRole } from "@prisma/client";

export const ADMIN_ROLES: UserRole[] = ["ADMIN", "MOD"];

export function isAdminRole(role: UserRole | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isTrueAdmin(role: UserRole | undefined | null): boolean {
  return role === "ADMIN";
}

/** Recruits share Member channel access — membership label, not a tighter chat gate. */
export const ROLE_RANK: Record<UserRole, number> = {
  FAN: 0,
  SUPERFAN: 1,
  RECRUIT: 2,
  MEMBER: 2,
  CREATOR: 3,
  MOD: 4,
  ADMIN: 5,
};

export function meetsMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

export function seniorRole(a: UserRole, b: UserRole): UserRole {
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MOD: "Mod",
  CREATOR: "Creator",
  MEMBER: "Member",
  RECRUIT: "Recruit",
  SUPERFAN: "Superfan",
  FAN: "Fan",
};

export const PLATFORM_ASSIGNABLE_ROLES: UserRole[] = [
  "RECRUIT",
  "MEMBER",
  "CREATOR",
  "MOD",
  "ADMIN",
];

export const CLIENT_ASSIGNABLE_ROLES: UserRole[] = [
  "FAN",
  "SUPERFAN",
  "RECRUIT",
  "MEMBER",
  "CREATOR",
  "MOD",
  "ADMIN",
];

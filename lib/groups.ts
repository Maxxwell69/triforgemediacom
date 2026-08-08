import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole, meetsMinRole } from "@/lib/rbac";

/**
 * Groups grant exceptions on top of the baseline role gates:
 *  - Channel.minRole is unchanged: a channel with no groups attached is
 *    visible exactly as before (role >= minRole).
 *  - A channel WITH groups attached becomes an "exception room" also
 *    visible to any user in one of those groups, regardless of role.
 *  - TikTask access is open by default; it's only restricted once a user
 *    belongs to at least one group and ALL of their groups opt out via
 *    grantsTikTaskAccess = false.
 *  - Course access: zero groups = open to anyone with a profile; one or
 *    more groups = member of at least one attached group. Admins/Mods
 *    always pass (preview).
 *
 * Groups v2 (scaffold): Home space (isHome), member roles, invites, and
 * applications. Channel trees scoped per group land in a later phase —
 * ACL behavior above stays the source of truth until then.
 */

export async function getHomeGroup() {
  return prisma.group.findFirst({
    where: { isHome: true },
    select: { id: true, name: true, description: true, color: true, joinMode: true },
  });
}

export async function getUserGroupIds(userId: string): Promise<string[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return memberships.map((m) => m.groupId);
}

export function canAccessChannel(
  userRole: UserRole,
  channel: { minRole: UserRole; groups: { id: string }[] },
  userGroupIds: string[]
): boolean {
  if (meetsMinRole(userRole, channel.minRole)) return true;
  if (channel.groups.length === 0) return false;
  const userGroupSet = new Set(userGroupIds);
  return channel.groups.some((g) => userGroupSet.has(g.id));
}

export function canAccessCourse(
  userRole: UserRole,
  course: { groups: { id: string }[] },
  userGroupIds: string[]
): boolean {
  if (isAdminRole(userRole)) return true;
  if (course.groups.length === 0) return true;
  const userGroupSet = new Set(userGroupIds);
  return course.groups.some((g) => userGroupSet.has(g.id));
}

export async function hasTikTaskAccess(userId: string): Promise<boolean> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { group: { select: { grantsTikTaskAccess: true } } },
  });
  if (memberships.length === 0) return true;
  return memberships.some((m) => m.group.grantsTikTaskAccess);
}

import { randomBytes } from "crypto";
import type { GroupJoinMode, GroupMemberRole, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole, meetsMinRole } from "@/lib/rbac";

/**
 * Groups grant exceptions on top of the baseline role gates:
 *  - Home-attached channels: require Home membership + minRole (main hub space).
 *  - Non-home group channels: membership is an "exception room" (bypasses role).
 *  - Channels with no groups: role gate only (legacy).
 *  - TikTask: open by default; restricted only when the user is in one or more
 *    non-Home groups and ALL of those groups set grantsTikTaskAccess = false.
 *  - Course access: zero groups = open; else member of an attached group.
 *    Admins/Mods always pass (preview).
 *  - Hub admins/mods are implicit members of every group (no apply/invite).
 */

const HOME_GROUP_ID = "home_group_system";

export type ChannelGroupRef = { id: string; isHome: boolean };

export async function getHomeGroup() {
  return prisma.group.findFirst({
    where: { isHome: true },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      joinMode: true,
      isHome: true,
    },
  });
}

/** Idempotent: ensure the Home row exists (migration seeds it; this is a safety net). */
export async function ensureHomeGroup() {
  const existing = await getHomeGroup();
  if (existing) return existing;

  return prisma.group.upsert({
    where: { id: HOME_GROUP_ID },
    update: { isHome: true, joinMode: "CLOSED" },
    create: {
      id: HOME_GROUP_ID,
      name: "Home",
      description: "Main hub space — default community channels live here.",
      color: "#FD4802",
      grantsTikTaskAccess: true,
      canCreateEvents: true,
      isHome: true,
      joinMode: "CLOSED",
    },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      joinMode: true,
      isHome: true,
    },
  });
}

/** Every active member belongs to Home. */
export async function ensureUserInHomeGroup(userId: string) {
  const home = await ensureHomeGroup();
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId, groupId: home.id } },
    update: {},
    create: { userId, groupId: home.id, role: "MEMBER" },
  });
  return home;
}

/**
 * One-shot bootstrap for environments that already have users/channels:
 * enroll ACTIVE users into Home and attach ungrouped MEMBER channels to Home.
 */
export async function bootstrapHomeSpace() {
  const home = await ensureHomeGroup();

  const activeUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  if (activeUsers.length > 0) {
    await prisma.groupMember.createMany({
      data: activeUsers.map((u) => ({
        userId: u.id,
        groupId: home.id,
        role: "MEMBER" as GroupMemberRole,
      })),
      skipDuplicates: true,
    });
  }

  const ungroupedMemberChannels = await prisma.channel.findMany({
    where: {
      minRole: "MEMBER",
      groups: { none: {} },
    },
    select: { id: true },
  });

  if (ungroupedMemberChannels.length > 0) {
    await prisma.group.update({
      where: { id: home.id },
      data: {
        channels: {
          connect: ungroupedMemberChannels.map((c) => ({ id: c.id })),
        },
      },
    });
  }

  return {
    homeId: home.id,
    enrolledUsers: activeUsers.length,
    attachedChannels: ungroupedMemberChannels.length,
  };
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
  channel: { minRole: UserRole; groups: ChannelGroupRef[] },
  userGroupIds: string[]
): boolean {
  if (isAdminRole(userRole)) return true;

  const userGroupSet = new Set(userGroupIds);
  const exceptionGroups = channel.groups.filter((g) => !g.isHome);
  if (exceptionGroups.some((g) => userGroupSet.has(g.id))) return true;

  if (!meetsMinRole(userRole, channel.minRole)) return false;

  const homeGroups = channel.groups.filter((g) => g.isHome);
  if (homeGroups.length > 0) {
    return homeGroups.some((g) => userGroupSet.has(g.id));
  }

  return true;
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
  // Home membership must not reopen TikTask for users restricted by other groups.
  const memberships = await prisma.groupMember.findMany({
    where: { userId, group: { isHome: false } },
    select: { group: { select: { grantsTikTaskAccess: true } } },
  });
  if (memberships.length === 0) return true;
  return memberships.some((m) => m.group.grantsTikTaskAccess);
}

export function generateGroupInviteToken(): string {
  return randomBytes(24).toString("hex");
}

export function groupInviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/groups/invite/${token}`;
}

export async function getMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { id: true, role: true, groupId: true },
  });
}

/** Hub admins/mods, or group MANAGER. */
export async function canManageGroup(
  userId: string,
  userRole: UserRole,
  groupId: string
): Promise<boolean> {
  if (isAdminRole(userRole)) return true;
  const membership = await getMembership(userId, groupId);
  return membership?.role === "MANAGER";
}

/** Hub admins/mods, or group MANAGER/MOD. */
export async function canModerateGroup(
  userId: string,
  userRole: UserRole,
  groupId: string
): Promise<boolean> {
  if (isAdminRole(userRole)) return true;
  const membership = await getMembership(userId, groupId);
  return membership?.role === "MANAGER" || membership?.role === "MOD";
}

export function isJoinableMode(mode: GroupJoinMode): boolean {
  return mode === "APPLY" || mode === "INVITE_ONLY";
}

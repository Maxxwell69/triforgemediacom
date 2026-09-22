import "server-only";

import type { UserRole } from "@prisma/client";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { isPlatformHubStaff } from "@/lib/hub/staffAccess";

export function isTriforgeMediaEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase().endsWith("@triforgemedia.com");
}

export async function isMainSystemActor(userId: string): Promise<boolean> {
  const user = await getControlPrisma().user.findUnique({
    where: { id: userId },
    select: { email: true, role: true, platformAccess: true, status: true },
  });
  if (!user) return false;
  return isTriforgeMediaEmail(user.email) || isPlatformHubStaff(user);
}

export async function loadClientHubOwnerEmail(hubId: string): Promise<string | null> {
  const hub = await getControlPrisma().clientHub.findUnique({
    where: { id: hubId },
    select: { clientAdminEmail: true },
  });
  return hub?.clientAdminEmail?.trim().toLowerCase() || null;
}

export async function platformStaffEmails(emails: string[]): Promise<Set<string>> {
  const unique = emails
    .map((email) => email.trim())
    .filter((email, index, all) => Boolean(email) && all.indexOf(email) === index);
  if (unique.length === 0) return new Set();
  const staff = await getControlPrisma().user.findMany({
    where: {
      OR: unique.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })),
      role: "ADMIN",
      platformAccess: true,
      status: { not: "BANNED" },
    },
    select: { email: true },
  });
  return new Set(staff.map((row) => row.email.trim().toLowerCase()));
}

export function hubHostStatusLockReason(opts: {
  actorIsMainSystem: boolean;
  email: string;
  role: UserRole | string;
  ownerEmail: string | null;
  isPlatformStaff: boolean;
}): string | null {
  const email = opts.email.trim().toLowerCase();
  if (isTriforgeMediaEmail(email) || opts.isPlatformStaff) {
    return "TriForge Media and main-system owners cannot be banned or edited on this hub.";
  }
  if (opts.actorIsMainSystem) return null;
  if (opts.ownerEmail && email === opts.ownerEmail) {
    return "The hub owner’s status cannot be changed.";
  }
  if (opts.role === "ADMIN") {
    return "Another admin’s status cannot be changed.";
  }
  return null;
}

export async function hubHostLocksByEmail(opts: {
  actorId: string;
  hubId: string | null;
  users: { email: string; role: UserRole | string }[];
}): Promise<Map<string, string>> {
  const locks = new Map<string, string>();
  if (!opts.hubId || opts.users.length === 0) return locks;

  const [actorIsMainSystem, ownerEmail, staff] = await Promise.all([
    isMainSystemActor(opts.actorId),
    loadClientHubOwnerEmail(opts.hubId),
    platformStaffEmails(opts.users.map((user) => user.email)),
  ]);

  for (const user of opts.users) {
    const reason = hubHostStatusLockReason({
      actorIsMainSystem,
      email: user.email,
      role: user.role,
      ownerEmail,
      isPlatformStaff: staff.has(user.email.trim().toLowerCase()),
    });
    if (reason) locks.set(user.email.trim().toLowerCase(), reason);
  }
  return locks;
}

export async function findHubMembershipForTenantUser(opts: {
  hubId: string;
  tenantUserId: string;
  email: string;
}) {
  return getControlPrisma().hubMembership.findFirst({
    where: {
      clientHubId: opts.hubId,
      OR: [
        { userId: opts.tenantUserId },
        { tenantUserId: opts.tenantUserId },
        { user: { email: { equals: opts.email, mode: "insensitive" } } },
      ],
    },
    select: { id: true },
  });
}

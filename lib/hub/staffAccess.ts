import "server-only";

import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { ensureTenantMember } from "@/lib/hub/ensureTenantMember";

/** Hub 0 ADMINs with platform access — not client-only accounts. */
export function isPlatformHubStaff(user: {
  role: string;
  platformAccess: boolean;
  status: string;
}) {
  return user.role === "ADMIN" && user.platformAccess && user.status !== "BANNED";
}

export async function listPlatformHubStaff() {
  return getControlPrisma().user.findMany({
    where: { role: "ADMIN", platformAccess: true, status: { not: "BANNED" } },
    select: { id: true, email: true, name: true },
    orderBy: { email: "asc" },
  });
}

export async function ensureStaffHubMembership(opts: {
  userId: string;
  clientHubId: string;
}): Promise<"granted" | "already" | "banned" | "not-staff" | "no-hub"> {
  const control = getControlPrisma();
  const [user, hub] = await Promise.all([
    control.user.findUnique({
      where: { id: opts.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        platformAccess: true,
        status: true,
      },
    }),
    control.clientHub.findUnique({
      where: { id: opts.clientHubId },
      select: { id: true, tenantDbName: true },
    }),
  ]);
  if (!user || !isPlatformHubStaff(user)) return "not-staff";
  if (!hub) return "no-hub";

  const existing = await control.hubMembership.findUnique({
    where: { userId_clientHubId: { userId: user.id, clientHubId: hub.id } },
  });
  if (existing?.status === "BANNED") return "banned";

  const membership = existing
    ? await control.hubMembership.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          status: "ACTIVE",
          inviteToken: null,
          inviteTokenExpiresAt: null,
        },
      })
    : await control.hubMembership.create({
        data: {
          userId: user.id,
          clientHubId: hub.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

  if (hub.tenantDbName) {
    const tenantUserId = await ensureTenantMember({
      tenantDbName: hub.tenantDbName,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      role: "ADMIN",
      status: "ACTIVE",
    });
    if (tenantUserId !== user.id) {
      await control.hubMembership.update({
        where: { id: membership.id },
        data: { tenantUserId },
      });
    }
  }

  return existing?.status === "ACTIVE" && existing.role === "ADMIN" ? "already" : "granted";
}

export async function grantPlatformAdminsHubAccess(clientHubId: string) {
  const staff = await listPlatformHubStaff();
  let granted = 0;
  for (const row of staff) {
    const result = await ensureStaffHubMembership({
      userId: row.id,
      clientHubId,
    });
    if (result === "granted" || result === "already") granted += 1;
  }
  return { granted, total: staff.length };
}

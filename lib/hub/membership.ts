import "server-only";

import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { ensureTenantMember } from "@/lib/hub/ensureTenantMember";

export async function findHubInviteByToken(token: string, clientHubId: string) {
  const control = getControlPrisma();
  const membership = await control.hubMembership.findFirst({
    where: { inviteToken: token, clientHubId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          status: true,
        },
      },
      clientHub: {
        select: { id: true, slug: true, name: true, tenantDbName: true },
      },
    },
  });
  if (!membership) return null;
  if (
    membership.inviteTokenExpiresAt &&
    membership.inviteTokenExpiresAt.getTime() <= Date.now()
  ) {
    return null;
  }
  if (membership.status === "BANNED") return null;
  return membership;
}

export async function activateHubMembership(membershipId: string) {
  const control = getControlPrisma();
  const membership = await control.hubMembership.update({
    where: { id: membershipId },
    data: {
      status: "ACTIVE",
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
    include: {
      user: { select: { id: true, email: true, name: true, image: true } },
      clientHub: { select: { tenantDbName: true } },
    },
  });

  if (membership.clientHub.tenantDbName) {
    const tenantUserId = await ensureTenantMember({
      tenantDbName: membership.clientHub.tenantDbName,
      user: membership.user,
      role: membership.role,
      status: "ACTIVE",
    });
    if (tenantUserId !== membership.user.id) {
      await control.hubMembership.update({
        where: { id: membership.id },
        data: { tenantUserId },
      });
    }
  }

  return membership;
}

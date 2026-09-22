import "server-only";

import { ensureUserInHomeGroup } from "@/lib/groups";
import {
  ensureControlProfile,
  ensureTenantMember,
} from "@/lib/hub/ensureTenantMember";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";

export async function joinClientHubAsFan(opts: {
  userId: string;
  clientHubId: string;
  tenantDbName: string;
}): Promise<"joined" | "already" | "banned"> {
  const control = getControlPrisma();
  const user = await control.user.findUnique({
    where: { id: opts.userId },
    select: { id: true, email: true, name: true, image: true, status: true },
  });
  if (!user || user.status === "BANNED") return "banned";

  const existing = await control.hubMembership.findUnique({
    where: { userId_clientHubId: { userId: user.id, clientHubId: opts.clientHubId } },
  });
  if (existing?.status === "BANNED") return "banned";

  await ensureControlProfile(user.id);
  const membership =
    existing ??
    (await control.hubMembership.create({
      data: {
        userId: user.id,
        clientHubId: opts.clientHubId,
        role: "FAN",
        status: "ACTIVE",
      },
    }));

  const tenantUserId = await ensureTenantMember({
    tenantDbName: opts.tenantDbName,
    user,
    role: membership.role,
    status: membership.status === "BANNED" ? "BANNED" : "ACTIVE",
  });
  if (tenantUserId !== user.id) {
    await control.hubMembership.update({
      where: { id: membership.id },
      data: { tenantUserId },
    });
  }
  await ensureUserInHomeGroup(user.id).catch(() => {});
  return existing ? "already" : "joined";
}

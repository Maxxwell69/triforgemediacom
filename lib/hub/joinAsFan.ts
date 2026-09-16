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
  if (existing) return "already";

  await ensureControlProfile(user.id);
  await control.hubMembership.create({
    data: {
      userId: user.id,
      clientHubId: opts.clientHubId,
      role: "FAN",
      status: "ACTIVE",
    },
  });
  await ensureTenantMember({
    tenantDbName: opts.tenantDbName,
    user,
    role: "FAN",
    status: "ACTIVE",
  });
  await ensureUserInHomeGroup(user.id).catch(() => {});
  return "joined";
}

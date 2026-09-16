import "server-only";

import type { UserRole, UserStatus } from "@prisma/client";
import { getTenantPrisma } from "@/lib/hub/tenantPrisma";

export async function ensureTenantMember(opts: {
  tenantDbName: string;
  user: { id: string; email: string; name: string | null; image?: string | null };
  role: UserRole;
  status: UserStatus;
}): Promise<string> {
  const db = getTenantPrisma(opts.tenantDbName);
  const byId = await db.user.findUnique({ where: { id: opts.user.id } });
  if (byId) {
    await db.user.update({
      where: { id: opts.user.id },
      data: {
        email: opts.user.email,
        name: opts.user.name,
        role: opts.role,
        status: opts.status,
      },
    });
    return byId.id;
  }

  const byEmail = await db.user.findUnique({ where: { email: opts.user.email } });
  if (byEmail) {
    await db.user.update({
      where: { id: byEmail.id },
      data: {
        name: opts.user.name,
        role: opts.role,
        status: opts.status,
      },
    });
    return byEmail.id;
  }

  await db.user.create({
    data: {
      id: opts.user.id,
      email: opts.user.email,
      name: opts.user.name,
      image: opts.user.image ?? null,
      role: opts.role,
      status: opts.status,
      passwordHash: null,
    },
  });
  return opts.user.id;
}

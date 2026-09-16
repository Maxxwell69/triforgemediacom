import "server-only";

import type { UserRole, UserStatus } from "@prisma/client";
import { getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";

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
    await copyControlProfile(opts.user.id, db);
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
    await copyControlProfile(byEmail.id, db);
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
  await copyControlProfile(opts.user.id, db);
  return opts.user.id;
}

async function copyControlProfile(
  userId: string,
  db: ReturnType<typeof getTenantPrisma>
) {
  const existing = await db.profile.findUnique({ where: { userId } });
  if (existing) return;
  const source = await getControlPrisma().profile.findUnique({ where: { userId } });
  if (!source) return;
  try {
    await db.profile.create({
      data: {
        userId,
        platform: source.platform,
        goals: source.goals ?? {},
        bio: source.bio,
        socialLinks: source.socialLinks ?? undefined,
        pinnedTiktokVideoUrl: source.pinnedTiktokVideoUrl,
        phone: source.phone,
        country: source.country,
        showRealName: source.showRealName,
        username: source.username,
      },
    });
  } catch (err) {
    console.error("copy control profile skipped", userId, err);
  }
}

import "server-only";

import { Prisma, type UserRole, type UserStatus } from "@prisma/client";
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
        image: opts.user.image ?? undefined,
        role: opts.role,
        status: opts.status,
      },
    });
    await copyControlProfileToTenant(opts.user.id, opts.user.id, db);
    return byId.id;
  }

  const byEmail = await db.user.findUnique({ where: { email: opts.user.email } });
  if (byEmail) {
    await db.user.update({
      where: { id: byEmail.id },
      data: {
        name: opts.user.name,
        image: opts.user.image ?? undefined,
        role: opts.role,
        status: opts.status,
      },
    });
    await copyControlProfileToTenant(opts.user.id, byEmail.id, db);
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
  await copyControlProfileToTenant(opts.user.id, opts.user.id, db);
  return opts.user.id;
}

/** Copy Hub 0 profile into this hub. People given a hub should not set up a second one. */
export async function copyControlProfileToTenant(
  controlUserId: string,
  tenantUserId: string,
  db: ReturnType<typeof getTenantPrisma>
) {
  const existing = await db.profile.findUnique({ where: { userId: tenantUserId } });
  if (existing) return existing;

  const source = await getControlPrisma().profile.findUnique({
    where: { userId: controlUserId },
  });
  if (!source) return null;

  const base = {
    userId: tenantUserId,
    platform: source.platform,
    goals: source.goals ?? {},
    bio: source.bio,
    socialLinks: source.socialLinks ?? undefined,
    pinnedTiktokVideoUrl: source.pinnedTiktokVideoUrl,
    phone: source.phone,
    country: source.country,
    showRealName: source.showRealName,
    streakCount: source.streakCount,
    lastActiveAt: source.lastActiveAt,
  };

  try {
    return await db.profile.create({
      data: { ...base, username: source.username },
    });
  } catch (err) {
    const uniqueClash =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (uniqueClash) {
      try {
        return await db.profile.create({ data: { ...base, username: null } });
      } catch (retryErr) {
        console.error("copy control profile skipped", controlUserId, retryErr);
        return db.profile.findUnique({ where: { userId: tenantUserId } });
      }
    }
    console.error("copy control profile skipped", controlUserId, err);
    return db.profile.findUnique({ where: { userId: tenantUserId } });
  }
}

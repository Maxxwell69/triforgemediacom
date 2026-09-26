import "server-only";

import { Prisma, type UserRole, type UserStatus } from "@prisma/client";
import { seniorRole } from "@/lib/rbac";
import { ensureTenantUserRoleValues, getControlPrisma, getTenantPrisma } from "@/lib/hub/tenantPrisma";

export async function ensureTenantMember(opts: {
  tenantDbName: string;
  user: { id: string; email: string; name: string | null; image?: string | null };
  role: UserRole;
  status: UserStatus;
}): Promise<string> {
  await ensureTenantUserRoleValues(opts.tenantDbName);
  const db = getTenantPrisma(opts.tenantDbName);
  const byId = await db.user.findUnique({ where: { id: opts.user.id } });
  if (byId) {
    await db.user.update({
      where: { id: opts.user.id },
      data: {
        email: opts.user.email,
        name: opts.user.name,
        image: opts.user.image ?? undefined,
        role: seniorRole(byId.role, opts.role),
        status: opts.status,
      },
    });
    await copyControlProfileToTenant(opts.user.id, opts.user.id, db);
    await ensureUserMemberType(db, byId.id, seniorRole(byId.role, opts.role));
    return byId.id;
  }

  const byEmail = await db.user.findUnique({ where: { email: opts.user.email } });
  if (byEmail) {
    await db.user.update({
      where: { id: byEmail.id },
      data: {
        name: opts.user.name,
        image: opts.user.image ?? undefined,
        role: seniorRole(byEmail.role, opts.role),
        status: opts.status,
      },
    });
    await copyControlProfileToTenant(opts.user.id, byEmail.id, db);
    await ensureUserMemberType(db, byEmail.id, seniorRole(byEmail.role, opts.role));
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
  await ensureUserMemberType(db, opts.user.id, opts.role);
  return opts.user.id;
}

async function ensureUserMemberType(
  db: ReturnType<typeof getTenantPrisma>,
  userId: string,
  role: UserRole
) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { memberTypeId: true },
    });
    if (user?.memberTypeId) return;
    const key = role === "FAN" ? "fan" : role === "SUPERFAN" ? "superfan" : "member";
    const type =
      (role === "FAN"
        ? await db.hubMemberType.findFirst({ where: { signupDefault: true } })
        : null) ??
      (await db.hubMemberType.findUnique({ where: { key } }));
    if (!type) return;
    await db.user.update({ where: { id: userId }, data: { memberTypeId: type.id } });
  } catch (err) {
    console.error("ensureUserMemberType skipped", userId, err);
  }
}

/** Network people keep their Forge profile. Brand-new fans get a stub so they skip onboarding. */
export async function ensureControlProfile(userId: string) {
  const control = getControlPrisma();
  const existing = await control.profile.findUnique({ where: { userId } });
  if (existing) return existing;
  return control.profile.create({
    data: { userId, platform: "OTHER", goals: {} },
  });
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

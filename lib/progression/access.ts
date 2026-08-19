import "server-only";

import { notFound } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { ensureOfficialProgression } from "@/lib/progression/populate";
import { evaluateProgression } from "@/lib/progression/engine";
import { isProgressionVisibleToMembers } from "@/lib/progression/settings";
import { hubHas } from "@/lib/hub/modules";

const RECRUIT_LEVEL = "Recruit";

export async function isProgressionEnrolled(userId: string) {
  const profile = await prisma.progressionProfile.findUnique({
    where: { userId },
    select: { enrolledAt: true },
  });
  return !!profile?.enrolledAt;
}

export async function enrollAsRecruit(userId: string) {
  await ensureOfficialProgression();
  const recruit = await prisma.progressionLevel.findFirst({
    where: { status: "ACTIVE", name: RECRUIT_LEVEL },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  const existing = await prisma.progressionProfile.findUnique({
    where: { userId },
    select: { enrolledAt: true, currentLevelId: true },
  });
  const enrolledAt = existing?.enrolledAt ?? new Date();
  await prisma.progressionProfile.upsert({
    where: { userId },
    create: {
      userId,
      enrolledAt,
      currentLevelId: recruit?.id ?? null,
    },
    update: {
      enrolledAt,
      ...(existing?.currentLevelId ? {} : { currentLevelId: recruit?.id ?? null }),
    },
  });
  await evaluateProgression(userId);
}

/** CN members (and staff) join the ladder as Recruit without applying. */
export async function maybeAutoEnrollProgression(userId: string, role?: UserRole) {
  if (await isProgressionEnrolled(userId)) return false;
  if (role && isAdminRole(role)) {
    await enrollAsRecruit(userId);
    return true;
  }
  const track = await getUserNetworkTrack(userId);
  if (track !== "CN") return false;
  await enrollAsRecruit(userId);
  return true;
}

export async function canSeeMemberProgressNav(role: UserRole) {
  if (!hubHas("progression")) return false;
  if (isAdminRole(role)) return true;
  return isProgressionVisibleToMembers();
}

export async function requireMemberProgressionPage(role: UserRole) {
  if (!hubHas("progression")) notFound();
  if (isAdminRole(role)) return;
  const visible = await isProgressionVisibleToMembers();
  if (!visible) notFound();
}

export async function requireProgressionEnrolled(userId: string) {
  if (!(await isProgressionEnrolled(userId))) {
    throw new Error("You are not enrolled in Creator Progression yet");
  }
}

export async function getProgressionApplication(userId: string) {
  return prisma.progressionApplication.findUnique({ where: { userId } });
}

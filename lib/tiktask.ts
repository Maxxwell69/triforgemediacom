import { prisma } from "@/lib/prisma";
import { activeGoalKeys } from "@/lib/goals";
import type { Profile } from "@prisma/client";

export function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Returns today's DailyTask rows for a user, generating them on-demand from
 * active TaskTemplates matching the user's platform/goals if none exist yet.
 * No cron needed for MVP1 — this just runs the first time someone opens
 * TikTask on a given day.
 */
export async function getOrGenerateTodayTasks(userId: string, profile: Profile) {
  const today = startOfTodayUTC();

  const existing = await prisma.dailyTask.findMany({
    where: { userId, date: today },
    include: { template: true },
    orderBy: { template: { createdAt: "asc" } },
  });
  if (existing.length > 0) return existing;

  const goalKeys = activeGoalKeys(profile.goals);

  const matchingTemplates = await prisma.taskTemplate.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ platform: null }, { platform: profile.platform }] },
        { OR: [{ goalKey: null }, { goalKey: { in: goalKeys } }] },
      ],
    },
  });

  if (matchingTemplates.length === 0) return [];

  await prisma.dailyTask.createMany({
    data: matchingTemplates.map((t) => ({
      userId,
      templateId: t.id,
      date: today,
    })),
    skipDuplicates: true,
  });

  return prisma.dailyTask.findMany({
    where: { userId, date: today },
    include: { template: true },
    orderBy: { template: { createdAt: "asc" } },
  });
}

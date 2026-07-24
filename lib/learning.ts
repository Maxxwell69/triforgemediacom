import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient;

export function getOrCreateEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

/**
 * Call whenever a LessonProgress.completedAt gets set. If every lesson in
 * the course is now complete for this user, marks the Enrollment complete,
 * awards course XP, and awards the course's badge (if any) — all within the
 * same transaction as the completion write that triggered it.
 */
export async function checkCourseCompletion(tx: TxClient, userId: string, courseId: string) {
  const lessons = await tx.lesson.findMany({ where: { courseId }, select: { id: true } });
  if (lessons.length === 0) return;
  const lessonIds = lessons.map((l) => l.id);

  const completedCount = await tx.lessonProgress.count({
    where: { userId, lessonId: { in: lessonIds }, completedAt: { not: null } },
  });
  if (completedCount < lessons.length) return;

  const enrollment = await tx.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
  if (enrollment.completedAt) return;

  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: { completedAt: new Date() },
  });

  const course = await tx.course.findUnique({
    where: { id: courseId },
    include: { badges: true },
  });
  if (!course) return;

  if (course.xpReward > 0) {
    await tx.xPEvent.create({
      data: {
        userId,
        amount: course.xpReward,
        source: "COURSE_COMPLETION",
        refId: enrollment.id,
      },
    });
  }

  for (const badge of course.badges) {
    const existing = await tx.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (!existing) {
      await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
    }
  }
}

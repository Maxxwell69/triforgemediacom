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

type DripLesson = {
  dripDaysAfterEnroll: number | null;
  dripUnlockAt: Date | null;
};

type DripEnrollment = {
  enrolledAt: Date;
} | null;

/**
 * Returns the datetime when a lesson becomes available for this enrollment,
 * or null if there is no drip schedule (available immediately).
 * When both relative and absolute drips are set, the later of the two wins.
 */
export function getLessonUnlockAt(
  lesson: DripLesson,
  enrollment: DripEnrollment
): Date | null {
  const candidates: Date[] = [];

  if (lesson.dripDaysAfterEnroll != null && enrollment) {
    const relative = new Date(enrollment.enrolledAt);
    relative.setUTCDate(relative.getUTCDate() + lesson.dripDaysAfterEnroll);
    candidates.push(relative);
  }

  if (lesson.dripUnlockAt) {
    candidates.push(new Date(lesson.dripUnlockAt));
  }

  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}

export function isLessonUnlocked(
  lesson: DripLesson,
  enrollment: DripEnrollment,
  now: Date = new Date()
): boolean {
  const unlockAt = getLessonUnlockAt(lesson, enrollment);
  if (!unlockAt) return true;
  return now.getTime() >= unlockAt.getTime();
}

/**
 * Call whenever a LessonProgress.completedAt gets set. If every lesson in
 * the course is now complete for this user, marks the Enrollment complete,
 * awards course XP, awards the course's badge (if any), and auto-adds the
 * user to the course's completion group — all within the same transaction.
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

  if (course.completionGroupId) {
    const existingMember = await tx.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId: course.completionGroupId },
      },
    });
    if (!existingMember) {
      await tx.groupMember.create({
        data: { userId, groupId: course.completionGroupId },
      });
    }
  }
}

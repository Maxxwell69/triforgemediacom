import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendBadgeEarnedEmail, sendCertificateEmail } from "@/lib/email";

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

type OrderableLesson = { id: string; moduleId: string | null; order: number };
type OrderableModule = { id: string; order: number };

/**
 * Flattens a course's modules/lessons into the same sequential order shown
 * on the course detail page (unsorted lessons first, then each module in
 * order). Used to drive "Lesson X of Y" and Previous/Next navigation.
 */
export function getOrderedLessonSequence<L extends OrderableLesson>(
  modules: OrderableModule[],
  lessons: L[]
): L[] {
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  const byModule = (moduleId: string | null) =>
    lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);

  return [
    ...byModule(null),
    ...sortedModules.flatMap((mod) => byModule(mod.id)),
  ];
}

export type CourseCompletionAward = {
  courseTitle: string;
  badges: { name: string; icon: string | null }[];
  certificateIssued: boolean;
} | null;

/**
 * Call whenever a LessonProgress.completedAt gets set. If every lesson in
 * the course is now complete for this user, marks the Enrollment complete,
 * awards course XP, awards the course's badge (if any), and auto-adds the
 * user to the course's completion group — all within the same transaction.
 *
 * Returns a summary of what was newly awarded so the caller can send emails
 * *after* the transaction commits (never send email from inside a DB
 * transaction — a slow/failed network call shouldn't hold the transaction
 * open or roll back an otherwise-successful award).
 */
export async function checkCourseCompletion(
  tx: TxClient,
  userId: string,
  courseId: string
): Promise<CourseCompletionAward> {
  const lessons = await tx.lesson.findMany({ where: { courseId }, select: { id: true } });
  if (lessons.length === 0) return null;
  const lessonIds = lessons.map((l) => l.id);

  const completedCount = await tx.lessonProgress.count({
    where: { userId, lessonId: { in: lessonIds }, completedAt: { not: null } },
  });
  if (completedCount < lessons.length) return null;

  const enrollment = await tx.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
  if (enrollment.completedAt) return null;

  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: { completedAt: new Date() },
  });

  const course = await tx.course.findUnique({
    where: { id: courseId },
    include: { badges: true },
  });
  if (!course) return null;

  let certificateIssued = false;
  if (course.certificateEnabled) {
    const existingCert = await tx.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!existingCert) {
      await tx.certificate.create({
        data: {
          userId,
          courseId,
          certNumber: `TFC-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
        },
      });
      certificateIssued = true;
    }
  }

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

  const newlyAwardedBadges: { name: string; icon: string | null }[] = [];
  for (const badge of course.badges) {
    const existing = await tx.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (!existing) {
      await tx.userBadge.create({ data: { userId, badgeId: badge.id } });
      newlyAwardedBadges.push({ name: badge.name, icon: badge.icon });
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

  return { courseTitle: course.title, badges: newlyAwardedBadges, certificateIssued };
}

/**
 * Sends the badge/certificate emails for a completion award. Call this
 * *after* the transaction containing checkCourseCompletion() has committed.
 */
export async function sendCourseCompletionEmails(
  userId: string,
  courseId: string,
  award: CourseCompletionAward
) {
  if (!award || (award.badges.length === 0 && !award.certificateIssued)) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return;
  const name = user.name || "there";

  for (const badge of award.badges) {
    await sendBadgeEarnedEmail(user.email, name, badge.name, badge.icon);
  }
  if (award.certificateIssued) {
    await sendCertificateEmail(user.email, name, award.courseTitle, courseId);
  }
}

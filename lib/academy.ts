import "server-only";

import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { requireAdminPage } from "@/lib/session";
import { isTrueAdmin } from "@/lib/rbac";
import { getOrderedLessonSequence } from "@/lib/learning";

export function academyDb() {
  return getControlPrisma();
}

export async function requireAcademyLearner() {
  return requireAdminPage();
}

export async function canAuthorAcademy() {
  const user = await requireAdminPage();
  const ctx = await getRequestHubContext();
  return ctx.kind === "platform" && isTrueAdmin(user.role);
}

export async function requireAcademyAuthor() {
  const user = await requireAdminPage();
  if (!(await canAuthorAcademy())) {
    throw new Error("Only Hub 0 admins can edit the academy.");
  }
  return user;
}

export async function getAcademyCourse(courseId: string) {
  return academyDb().course.findFirst({
    where: { id: courseId, hubOwnerOnly: true },
    include: {
      quiz: { select: { id: true, title: true, passScore: true } },
      modules: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      lessons: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          order: true,
          moduleId: true,
          thumbnailUrl: true,
          dripDaysAfterEnroll: true,
          dripUnlockAt: true,
        },
      },
    },
  });
}

export async function ensureAcademyEnrollment(userId: string, courseId: string) {
  return academyDb().enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

export async function markAcademyCompleteIfReady(userId: string, courseId: string) {
  const db = academyDb();
  const lessons = await db.lesson.findMany({ where: { courseId }, select: { id: true } });
  if (lessons.length === 0) return;
  const completedCount = await db.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: lessons.map((lesson) => lesson.id) },
      completedAt: { not: null },
    },
  });
  if (completedCount < lessons.length) return;

  const quiz = await db.quiz.findUnique({ where: { courseId }, select: { id: true } });
  if (quiz) {
    const passed = await db.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id, passed: true },
      select: { id: true },
    });
    if (!passed) return;
  }

  await db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { completedAt: new Date() },
    create: { userId, courseId, completedAt: new Date() },
  });
}

export { getOrderedLessonSequence };

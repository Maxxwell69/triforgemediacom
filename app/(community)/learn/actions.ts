"use server";

import type { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import {
  checkCourseCompletion,
  getOrCreateEnrollment,
  isLessonUnlocked,
  sendCourseCompletionEmails,
} from "@/lib/learning";
import { canAccessCourse, getUserGroupIds } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";

function revalidateLesson(courseId: string, lessonId: string) {
  revalidatePath("/learn");
  revalidatePath(`/learn/${courseId}`);
  revalidatePath(`/learn/${courseId}/lessons/${lessonId}`);
  revalidatePath("/account");
}

async function assertLessonAccessible(userId: string, userRole: UserRole, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      assignment: { select: { id: true } },
      course: {
        select: {
          id: true,
          isPublished: true,
          groups: { select: { id: true } },
        },
      },
    },
  });
  if (!lesson || (!lesson.course.isPublished && !isAdminRole(userRole))) {
    throw new Error("Lesson not found");
  }

  const userGroupIds = await getUserGroupIds(userId);
  if (!canAccessCourse(userRole, lesson.course, userGroupIds)) {
    throw new Error("You don't have access to this course");
  }

  const enrollment = await getOrCreateEnrollment(userId, lesson.courseId);
  if (!isAdminRole(userRole) && !isLessonUnlocked(lesson, enrollment)) {
    throw new Error("This lesson is still locked");
  }

  return lesson;
}

export async function markLessonComplete(lessonId: string) {
  const { user } = await requireProfile();
  const lesson = await assertLessonAccessible(user.id, user.role, lessonId);
  if (lesson.assignment) {
    throw new Error("This lesson requires an approved assignment submission to complete.");
  }

  const award = await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completedAt: new Date() },
      create: { userId: user.id, lessonId, completedAt: new Date() },
    });
    return checkCourseCompletion(tx, user.id, lesson.courseId);
  });
  await sendCourseCompletionEmails(user.id, lesson.courseId, award);
  const { evaluateProgression } = await import("@/lib/progression/engine");
  await evaluateProgression(user.id);
  revalidatePath("/progress");

  revalidateLesson(lesson.courseId, lessonId);
}

export type QuizSubmitResult = { score: number; passed: boolean; passScore: number };

export async function submitQuizAttempt(
  courseId: string,
  answers: Record<string, string | string[]>
): Promise<QuizSubmitResult> {
  const { user } = await requireProfile();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      groups: { select: { id: true } },
      quiz: { include: { questions: true } },
      lessons: { select: { id: true } },
    },
  });
  if (!course || (!course.isPublished && !isAdminRole(user.role))) {
    throw new Error("Course not found");
  }
  if (!course.quiz) throw new Error("This course doesn't have a quiz.");

  const userGroupIds = await getUserGroupIds(user.id);
  if (!canAccessCourse(user.role, course, userGroupIds)) {
    throw new Error("You don't have access to this course");
  }

  await getOrCreateEnrollment(user.id, courseId);

  // Members must finish every lesson before taking the course quiz.
  if (!isAdminRole(user.role) && course.lessons.length > 0) {
    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId: user.id,
        lessonId: { in: course.lessons.map((l) => l.id) },
        completedAt: { not: null },
      },
    });
    if (completedCount < course.lessons.length) {
      throw new Error("Finish all lessons before taking the course quiz.");
    }
  }

  const quiz = course.quiz;
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;

  for (const question of quiz.questions) {
    const submitted = answers[question.id];
    const correct = question.correctAnswer;

    if (question.type === "MULTI_SELECT") {
      const submittedArr = Array.isArray(submitted) ? [...submitted].sort() : [];
      const correctArr = Array.isArray(correct) ? [...(correct as string[])].sort() : [];
      if (
        submittedArr.length === correctArr.length &&
        submittedArr.every((v, i) => v === correctArr[i])
      ) {
        correctCount++;
      }
    } else if (typeof submitted === "string" && submitted === correct) {
      correctCount++;
    }
  }

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= quiz.passScore;

  const award = await prisma.$transaction(async (tx) => {
    const attemptCount = await tx.quizAttempt.count({
      where: { userId: user.id, quizId: quiz.id },
    });

    await tx.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        answers,
        score,
        passed,
        attemptNumber: attemptCount + 1,
      },
    });

    if (passed) {
      return checkCourseCompletion(tx, user.id, courseId);
    }
    return null;
  });
  await sendCourseCompletionEmails(user.id, courseId, award);
  const { evaluateProgression } = await import("@/lib/progression/engine");
  await evaluateProgression(user.id);
  revalidatePath("/progress");

  revalidatePath("/learn");
  revalidatePath(`/learn/${courseId}`);
  revalidatePath(`/learn/${courseId}/quiz`);
  revalidatePath("/account");

  return { score, passed, passScore: quiz.passScore };
}

export async function submitAssignment(
  lessonId: string,
  input: { submissionUrl: string; submissionText: string }
) {
  const { user } = await requireProfile();
  await assertLessonAccessible(user.id, user.role, lessonId);

  const submissionUrl = input.submissionUrl.trim();
  const submissionText = input.submissionText.trim();
  if (!submissionUrl && !submissionText) {
    throw new Error("Add a link or a written response before submitting.");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { assignment: true },
  });
  if (!lesson || !lesson.assignment) throw new Error("This lesson doesn't have an assignment.");

  await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId: lesson.assignment.id, userId: user.id } },
    update: {
      submissionUrl: submissionUrl || null,
      submissionText: submissionText || null,
      status: "PENDING",
      feedback: null,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
    },
    create: {
      assignmentId: lesson.assignment.id,
      userId: user.id,
      submissionUrl: submissionUrl || null,
      submissionText: submissionText || null,
    },
  });

  revalidateLesson(lesson.courseId, lessonId);
}

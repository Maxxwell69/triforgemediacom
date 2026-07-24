"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { checkCourseCompletion } from "@/lib/learning";

function revalidateLesson(courseId: string, lessonId: string) {
  revalidatePath("/learn");
  revalidatePath(`/learn/${courseId}`);
  revalidatePath(`/learn/${courseId}/lessons/${lessonId}`);
  revalidatePath("/account");
}

export async function markLessonComplete(lessonId: string) {
  const { user } = await requireProfile();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: { select: { id: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");
  if (lesson.quiz) throw new Error("This lesson requires passing its quiz to complete.");

  await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completedAt: new Date() },
      create: { userId: user.id, lessonId, completedAt: new Date() },
    });
    await checkCourseCompletion(tx, user.id, lesson.courseId);
  });

  revalidateLesson(lesson.courseId, lessonId);
}

export type QuizSubmitResult = { score: number; passed: boolean; passScore: number };

export async function submitQuizAttempt(
  lessonId: string,
  answers: Record<string, string | string[]>
): Promise<QuizSubmitResult> {
  const { user } = await requireProfile();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { quiz: { include: { questions: true } } },
  });
  if (!lesson || !lesson.quiz) throw new Error("This lesson doesn't have a quiz.");

  const quiz = lesson.quiz;
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

  await prisma.$transaction(async (tx) => {
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
      await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId } },
        update: { completedAt: new Date() },
        create: { userId: user.id, lessonId, completedAt: new Date() },
      });
      await checkCourseCompletion(tx, user.id, lesson.courseId);
    }
  });

  revalidateLesson(lesson.courseId, lessonId);

  return { score, passed, passScore: quiz.passScore };
}

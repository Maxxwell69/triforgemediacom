"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  academyDb,
  canAuthorAcademy,
  ensureAcademyEnrollment,
  markAcademyCompleteIfReady,
  requireAcademyAuthor,
  requireAcademyLearner,
} from "@/lib/academy";

function revalidateAcademy(courseId?: string) {
  revalidatePath("/admin/academy");
  if (courseId) {
    revalidatePath(`/admin/academy/${courseId}`);
    revalidatePath(`/admin/academy/${courseId}/quiz`);
  }
}

export async function createAcademyCourse(formData: FormData) {
  await requireAcademyAuthor();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Add a course title.");
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
  const db = academyDb();
  const maxOrder = await db.course.aggregate({
    where: { hubOwnerOnly: true },
    _max: { order: true },
  });
  const course = await db.course.create({
    data: {
      title,
      description: description || null,
      category: category || null,
      thumbnailUrl: thumbnailUrl || null,
      hubOwnerOnly: true,
      isPublished: false,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
  revalidateAcademy();
  redirect(`/admin/courses/${course.id}`);
}

export async function markAcademyLessonComplete(lessonId: string) {
  const user = await requireAcademyLearner();
  const db = academyDb();
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, hubOwnerOnly: true, isPublished: true } } },
  });
  if (!lesson?.course.hubOwnerOnly) throw new Error("Lesson not found.");
  const author = await canAuthorAcademy();
  if (!lesson.course.isPublished && !author) throw new Error("This course is not published yet.");

  await ensureAcademyEnrollment(user.id, lesson.courseId);
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completedAt: new Date() },
    create: { userId: user.id, lessonId, completedAt: new Date() },
  });
  await markAcademyCompleteIfReady(user.id, lesson.courseId);
  revalidateAcademy(lesson.courseId);
  revalidatePath(`/admin/academy/${lesson.courseId}/lessons/${lessonId}`);
}

export async function submitAcademyQuiz(
  courseId: string,
  answers: Record<string, string | string[]>
) {
  const user = await requireAcademyLearner();
  const db = academyDb();
  const course = await db.course.findFirst({
    where: { id: courseId, hubOwnerOnly: true },
    include: {
      quiz: { include: { questions: true } },
      lessons: { select: { id: true } },
    },
  });
  if (!course?.quiz) throw new Error("Quiz not found.");
  const author = await canAuthorAcademy();
  if (!course.isPublished && !author) throw new Error("This course is not published yet.");

  await ensureAcademyEnrollment(user.id, courseId);

  if (course.lessons.length > 0) {
    const completedCount = await db.lessonProgress.count({
      where: {
        userId: user.id,
        lessonId: { in: course.lessons.map((lesson) => lesson.id) },
        completedAt: { not: null },
      },
    });
    if (completedCount < course.lessons.length) {
      throw new Error("Finish all lessons before taking the quiz.");
    }
  }

  const quiz = course.quiz;
  let correctCount = 0;
  for (const question of quiz.questions) {
    const submitted = answers[question.id];
    const correct = question.correctAnswer;
    if (question.type === "MULTI_SELECT") {
      const submittedArr = Array.isArray(submitted) ? [...submitted].sort() : [];
      const correctArr = Array.isArray(correct) ? [...(correct as string[])].sort() : [];
      if (
        submittedArr.length === correctArr.length &&
        submittedArr.every((value, i) => value === correctArr[i])
      ) {
        correctCount += 1;
      }
    } else if (typeof submitted === "string" && submitted === correct) {
      correctCount += 1;
    }
  }

  const score =
    quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  const passed = score >= quiz.passScore;
  const attemptCount = await db.quizAttempt.count({
    where: { userId: user.id, quizId: quiz.id },
  });
  await db.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: quiz.id,
      answers,
      score,
      passed,
      attemptNumber: attemptCount + 1,
    },
  });
  if (passed) await markAcademyCompleteIfReady(user.id, courseId);
  revalidateAcademy(courseId);
  revalidatePath(`/admin/academy/${courseId}/quiz`);
  return { score, passed, passScore: quiz.passScore };
}

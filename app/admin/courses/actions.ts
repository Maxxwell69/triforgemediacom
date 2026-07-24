"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import {
  badgeSchema,
  courseSchema,
  lessonSchema,
  quizSchema,
  questionSchema,
  type QuestionTypeValue,
} from "@/lib/validations/course";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function revalidateCourse(courseId: string) {
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/learn");
  revalidatePath(`/learn/${courseId}`);
}

// ---------- Course ----------

function parseCourseForm(formData: FormData) {
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    category: formData.get("category"),
    xpReward: formData.get("xpReward"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid course");
  }
  return parsed.data;
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const data = parseCourseForm(formData);
  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });

  await prisma.course.create({
    data: {
      title: data.title,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      category: data.category || null,
      xpReward: data.xpReward,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/admin/courses");
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseCourseForm(formData);
  const isPublished = formData.get("isPublished") === "on";

  await prisma.course.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
      category: data.category || null,
      xpReward: data.xpReward,
      isPublished,
    },
  });

  revalidateCourse(id);
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
  revalidatePath("/learn");
}

export async function setCoursePublished(courseId: string, isPublished: boolean) {
  await requireAdmin();
  await prisma.course.update({ where: { id: courseId }, data: { isPublished } });
  revalidateCourse(courseId);
}

export async function moveCourseOrder(courseId: string, direction: "up" | "down") {
  await requireAdmin();

  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true },
  });
  const index = courses.findIndex((c) => c.id === courseId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= courses.length) return;

  const current = courses[index];
  const swapWith = courses[swapIndex];

  await prisma.$transaction([
    prisma.course.update({ where: { id: current.id }, data: { order: swapWith.order } }),
    prisma.course.update({ where: { id: swapWith.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/admin/courses");
  revalidatePath("/learn");
}

// ---------- Lesson ----------

function parseLessonForm(formData: FormData) {
  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    videoUrl: formData.get("videoUrl"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid lesson");
  }
  return parsed.data;
}

export async function createLesson(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId"));
  const data = parseLessonForm(formData);
  const maxOrder = await prisma.lesson.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  await prisma.lesson.create({
    data: {
      courseId,
      title: data.title,
      videoUrl: data.videoUrl || null,
      content: data.content || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateCourse(courseId);
}

export async function updateLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  const data = parseLessonForm(formData);

  await prisma.lesson.update({
    where: { id },
    data: {
      title: data.title,
      videoUrl: data.videoUrl || null,
      content: data.content || null,
    },
  });

  revalidateCourse(courseId);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await requireAdmin();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidateCourse(courseId);
}

export async function moveLessonOrder(
  lessonId: string,
  courseId: string,
  direction: "up" | "down"
) {
  await requireAdmin();

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, order: true },
  });
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= lessons.length) return;

  const current = lessons[index];
  const swapWith = lessons[swapIndex];

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: current.id }, data: { order: swapWith.order } }),
    prisma.lesson.update({ where: { id: swapWith.id }, data: { order: current.order } }),
  ]);

  revalidateCourse(courseId);
}

// ---------- Quiz ----------

function parseQuizForm(formData: FormData) {
  const parsed = quizSchema.safeParse({
    title: formData.get("title"),
    passScore: formData.get("passScore"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid quiz");
  }
  return parsed.data;
}

export async function createQuiz(formData: FormData) {
  await requireAdmin();
  const lessonId = String(formData.get("lessonId"));
  const courseId = String(formData.get("courseId"));
  const data = parseQuizForm(formData);

  await prisma.quiz.create({
    data: { lessonId, title: data.title, passScore: data.passScore },
  });

  revalidateCourse(courseId);
}

export async function updateQuiz(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  const data = parseQuizForm(formData);

  await prisma.quiz.update({
    where: { id },
    data: { title: data.title, passScore: data.passScore },
  });

  revalidateCourse(courseId);
}

export async function deleteQuiz(quizId: string, courseId: string) {
  await requireAdmin();
  await prisma.quiz.delete({ where: { id: quizId } });
  revalidateCourse(courseId);
}

// ---------- Question ----------

function parseQuestionAnswer(
  type: QuestionTypeValue,
  optionsRaw: string,
  correctAnswerRaw: string
): { options: string[]; correctAnswer: string | string[] } {
  if (type === "TRUE_FALSE") {
    const options = ["True", "False"];
    if (correctAnswerRaw !== "True" && correctAnswerRaw !== "False") {
      throw new Error("Select True or False as the correct answer");
    }
    return { options, correctAnswer: correctAnswerRaw };
  }

  let options: unknown;
  try {
    options = JSON.parse(optionsRaw);
  } catch {
    throw new Error("Invalid options");
  }
  if (!Array.isArray(options) || options.length < 2 || !options.every((o) => typeof o === "string")) {
    throw new Error("Provide at least two options");
  }

  if (type === "MULTI_SELECT") {
    let correctAnswer: unknown;
    try {
      correctAnswer = JSON.parse(correctAnswerRaw);
    } catch {
      throw new Error("Invalid correct answer");
    }
    if (
      !Array.isArray(correctAnswer) ||
      correctAnswer.length === 0 ||
      !correctAnswer.every((a) => typeof a === "string" && options.includes(a))
    ) {
      throw new Error("Select at least one valid correct answer");
    }
    return { options, correctAnswer };
  }

  if (!options.includes(correctAnswerRaw)) {
    throw new Error("Select a valid correct answer");
  }
  return { options, correctAnswer: correctAnswerRaw };
}

export async function createQuestion(formData: FormData) {
  await requireAdmin();
  const quizId = String(formData.get("quizId"));
  const courseId = String(formData.get("courseId"));
  const optionsRaw = String(formData.get("optionsJson") ?? "");
  const correctAnswerRaw = String(formData.get("correctAnswerJson") ?? "");

  const parsed = questionSchema.safeParse({
    type: formData.get("type"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid question");
  }

  const { options, correctAnswer } = parseQuestionAnswer(
    parsed.data.type,
    optionsRaw,
    correctAnswerRaw
  );

  const maxOrder = await prisma.question.aggregate({
    where: { quizId },
    _max: { order: true },
  });

  await prisma.question.create({
    data: {
      quizId,
      type: parsed.data.type,
      text: parsed.data.text,
      options,
      correctAnswer,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateCourse(courseId);
}

export async function updateQuestion(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("courseId"));
  const optionsRaw = String(formData.get("optionsJson") ?? "");
  const correctAnswerRaw = String(formData.get("correctAnswerJson") ?? "");

  const parsed = questionSchema.safeParse({
    type: formData.get("type"),
    text: formData.get("text"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid question");
  }

  const { options, correctAnswer } = parseQuestionAnswer(
    parsed.data.type,
    optionsRaw,
    correctAnswerRaw
  );

  await prisma.question.update({
    where: { id },
    data: {
      type: parsed.data.type,
      text: parsed.data.text,
      options,
      correctAnswer,
    },
  });

  revalidateCourse(courseId);
}

export async function deleteQuestion(questionId: string, courseId: string) {
  await requireAdmin();
  await prisma.question.delete({ where: { id: questionId } });
  revalidateCourse(courseId);
}

// ---------- Badge ----------

export async function upsertCourseBadge(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId"));
  const badgeId = formData.get("badgeId");

  const parsed = badgeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid badge");
  }

  const data = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    icon: parsed.data.icon || null,
    courseId,
  };

  if (badgeId) {
    await prisma.badge.update({ where: { id: String(badgeId) }, data });
  } else {
    await prisma.badge.create({ data });
  }

  revalidateCourse(courseId);
}

export async function deleteBadge(badgeId: string, courseId: string) {
  await requireAdmin();
  await prisma.badge.delete({ where: { id: badgeId } });
  revalidateCourse(courseId);
}

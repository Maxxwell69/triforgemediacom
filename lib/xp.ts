import type { Prisma, XPSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export const POINT_DEFAULTS = {
  lesson: 15,
  lessonExerciseBonus: 10,
  quizPass: 50,
  quizPerfectBonus: 25,
  courseCompletion: 100,
  certTrainee: 150,
  certCertified: 300,
  certMaster: 750,
  skillUnlock: 200,
  streak3: 25,
  streak7: 75,
  streak30: 300,
  microDailyCap: 50,
  standardDailyCap: 100,
} as const;

export async function awardXpOnce(
  db: Db,
  opts: {
    userId: string;
    amount: number;
    source: XPSource;
    refId: string;
    note?: string;
    categoryId?: string | null;
  }
): Promise<boolean> {
  if (opts.amount <= 0 || !opts.refId) return false;
  const existing = await db.xPEvent.findFirst({
    where: { userId: opts.userId, source: opts.source, refId: opts.refId },
    select: { id: true },
  });
  if (existing) return false;

  await db.xPEvent.create({
    data: {
      userId: opts.userId,
      amount: opts.amount,
      source: opts.source,
      refId: opts.refId,
      note: opts.note ?? null,
    },
  });

  if (opts.categoryId) {
    await db.progressionCategoryXp.upsert({
      where: { userId_categoryId: { userId: opts.userId, categoryId: opts.categoryId } },
      create: { userId: opts.userId, categoryId: opts.categoryId, amount: opts.amount },
      update: { amount: { increment: opts.amount } },
    });
  }

  return true;
}

export function certTierXpAward(tierName: string): number {
  const name = tierName.trim().toLowerCase();
  if (name === "trainee") return POINT_DEFAULTS.certTrainee;
  if (name === "certified") return POINT_DEFAULTS.certCertified;
  if (name === "master") return POINT_DEFAULTS.certMaster;
  return 0;
}

export async function awardLessonCompletionXp(
  db: Db,
  userId: string,
  lesson: {
    id: string;
    xpValue: number;
    exerciseXpBonus: number;
    assignment?: { id: string } | null;
    course: { progressionCategoryId: string | null };
  }
) {
  const amount =
    (lesson.xpValue || POINT_DEFAULTS.lesson) +
    (lesson.assignment ? lesson.exerciseXpBonus || POINT_DEFAULTS.lessonExerciseBonus : 0);
  return awardXpOnce(db, {
    userId,
    amount,
    source: "LESSON_COMPLETION",
    refId: lesson.id,
    note: lesson.assignment ? "Lesson + exercise" : "Lesson complete",
    categoryId: lesson.course.progressionCategoryId,
  });
}

export async function awardQuizPassXp(
  db: Db,
  userId: string,
  quiz: {
    id: string;
    passXp: number;
    perfectXpBonus: number;
    course: { progressionCategoryId: string | null };
  },
  score: number
) {
  const perfect = score >= 100;
  const amount =
    (quiz.passXp || POINT_DEFAULTS.quizPass) +
    (perfect ? quiz.perfectXpBonus || POINT_DEFAULTS.quizPerfectBonus : 0);
  return awardXpOnce(db, {
    userId,
    amount,
    source: "QUIZ_PASS",
    refId: quiz.id,
    note: perfect ? "Quiz 100%" : "Quiz passed",
    categoryId: quiz.course.progressionCategoryId,
  });
}

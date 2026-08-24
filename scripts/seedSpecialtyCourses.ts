/**
 * Inserts the 7 Skill Mastery specialization courses (3 lessons + quiz each)
 * as unpublished drafts. Re-runnable: updates content, never auto-publishes.
 *
 * Staging only — uses DATABASE_URL (or STAGING_DATABASE_URL if --staging).
 * Guarded against production via scripts/guardDb.ts.
 *
 *   npx tsx scripts/seedSpecialtyCourses.ts
 *   npx tsx scripts/seedSpecialtyCourses.ts --staging
 */
import "dotenv/config";
import type { PrismaClient } from "@prisma/client";
import { COURSES, lessonHtml, type CourseSeed } from "./specialtyCourseContent";


async function upsertCourse(
  prisma: PrismaClient,
  seed: CourseSeed,
  index: number,
  skillMasteryId: string | null
) {
  const existing = await prisma.course.findFirst({
    where: { title: seed.title },
    select: { id: true, isPublished: true },
  });

  const data = {
    title: seed.title,
    description: seed.description,
    category: "Skill Mastery",
    isPublished: false,
    xpReward: 50,
    order: index,
    progressionEnabled: true,
    progressionCategoryId: skillMasteryId,
    progressionLevelId: null,
    progressionSpecialty: seed.specialty,
  };

  const course = existing
    ? await prisma.course.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Never flip a course the admin already published; first insert is always draft.
          isPublished: existing.isPublished ? existing.isPublished : false,
        },
      })
    : await prisma.course.create({ data });

  for (let i = 0; i < seed.lessons.length; i += 1) {
    const lesson = seed.lessons[i];
    const found = await prisma.lesson.findFirst({
      where: { courseId: course.id, title: lesson.title },
      select: { id: true },
    });
    const lessonData = {
      title: lesson.title,
      order: i,
      content: lessonHtml(lesson),
      videoUrl: null,
    };
    if (found) {
      await prisma.lesson.update({ where: { id: found.id }, data: lessonData });
    } else {
      await prisma.lesson.create({ data: { courseId: course.id, ...lessonData } });
    }
  }

  const quiz = await prisma.quiz.upsert({
    where: { courseId: course.id },
    create: {
      courseId: course.id,
      title: `${seed.title} quiz`,
      passScore: 75,
    },
    update: {
      title: `${seed.title} quiz`,
      passScore: 75,
    },
  });

  await prisma.question.deleteMany({ where: { quizId: quiz.id } });
  for (let i = 0; i < seed.questions.length; i += 1) {
    const question = seed.questions[i];
    const options = question.type === "TRUE_FALSE" ? ["True", "False"] : question.options ?? [];
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        type: question.type,
        text: question.text,
        options,
        correctAnswer: question.correct,
        order: i,
      },
    });
  }

  return {
    title: course.title,
    id: course.id,
    published: course.isPublished,
    specialty: seed.specialty,
    lessons: seed.lessons.length,
    questions: seed.questions.length,
  };
}

async function main() {
  if (process.argv.includes("--staging") && process.env.STAGING_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  }
  await import("./guardDb");
  const { prisma } = await import("../lib/prisma");

  const skillMastery = await prisma.progressionCategory.findFirst({
    where: { name: "Skill Mastery" },
    select: { id: true },
  });
  if (!skillMastery) {
    console.warn("Skill Mastery category not found â€” courses will still be created as drafts without a track id.");
  }

  const results = [];
  for (let i = 0; i < COURSES.length; i += 1) {
    results.push(await upsertCourse(prisma, COURSES[i], i, skillMastery?.id ?? null));
  }

  console.log("Seeded unpublished specialty courses:");
  for (const row of results) {
    console.log(
      `  ${row.published ? "PUBLISHED" : "DRAFT"} Â· ${row.specialty} Â· ${row.title} (${row.lessons} lessons, ${row.questions} quiz questions)`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

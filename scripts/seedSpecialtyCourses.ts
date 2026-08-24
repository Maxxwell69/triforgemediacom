/**
 * Inserts the 7 Skill Mastery specialization courses (3 lessons + quiz each).
 * Re-runnable: updates those 7 by title. Never deletes any other course.
 *
 *   npx tsx scripts/seedSpecialtyCourses.ts
 *   npx tsx scripts/seedSpecialtyCourses.ts --staging
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedSpecialtyCourses.ts --production --publish
 */
import "dotenv/config";
import type { PrismaClient } from "@prisma/client";
import { COURSES, lessonHtml, type CourseSeed } from "./specialtyCourseContent";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function upsertCourse(
  prisma: PrismaClient,
  seed: CourseSeed,
  skillMasteryId: string | null,
  order: number,
  publish: boolean
) {
  const existing = await prisma.course.findFirst({
    where: { title: seed.title },
    select: { id: true, isPublished: true, progressionSpecialty: true },
  });

  if (existing?.progressionSpecialty && existing.progressionSpecialty !== seed.specialty) {
    throw new Error(
      `Refusing to overwrite "${seed.title}" — it is attached to ${existing.progressionSpecialty}, not ${seed.specialty}.`
    );
  }

  const shared = {
    title: seed.title,
    description: seed.description,
    category: "Skill Mastery",
    xpReward: 50,
    progressionEnabled: true,
    progressionCategoryId: skillMasteryId,
    progressionLevelId: null,
    progressionSpecialty: seed.specialty,
  };

  const course = existing
    ? await prisma.course.update({
        where: { id: existing.id },
        data: {
          ...shared,
          isPublished: publish ? true : existing.isPublished,
        },
      })
    : await prisma.course.create({
        data: {
          ...shared,
          order,
          isPublished: publish,
        },
      });

  for (let i = 0; i < seed.lessons.length; i += 1) {
    const lesson = seed.lessons[i];
    const found = await prisma.lesson.findFirst({
      where: { courseId: course.id, title: lesson.title },
      select: { id: true },
    });
    const lessonData = {
      title: lesson.title,
      order: i,
      content: lessonHtml(lesson, i),
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
    created: !existing,
    specialty: seed.specialty,
    lessons: seed.lessons.length,
    questions: seed.questions.length,
  };
}

async function main() {
  const production = process.argv.includes("--production");
  const publish = process.argv.includes("--publish");

  if (process.argv.includes("--staging") && process.env.STAGING_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  }

  if (production) {
    const prodUrl = process.env.PRODUCTION_DATABASE_URL;
    if (!prodUrl) {
      throw new Error("PRODUCTION_DATABASE_URL is not set.");
    }
    if (process.env.ALLOW_PROD_DB_OPS !== "yes") {
      throw new Error("Refusing production seed without ALLOW_PROD_DB_OPS=yes.");
    }
    const prodHost = process.env.PROD_DB_HOST?.trim();
    const urlHost = extractHost(prodUrl);
    if (prodHost && urlHost && !urlHost.includes(prodHost)) {
      throw new Error(
        `PRODUCTION_DATABASE_URL host (${urlHost}) does not match PROD_DB_HOST (${prodHost}).`
      );
    }
    process.env.DATABASE_URL = prodUrl;
  }

  await import("./guardDb");
  const { prisma } = await import("../lib/prisma");

  const before = await prisma.course.findMany({
    select: { id: true, title: true, isPublished: true },
    orderBy: { title: "asc" },
  });
  console.log(`Existing courses: ${before.length}`);
  for (const course of before) {
    console.log(`  ${course.isPublished ? "LIVE" : "draft"} | ${course.title}`);
  }

  const skillMastery = await prisma.progressionCategory.findFirst({
    where: { name: "Skill Mastery" },
    select: { id: true },
  });
  if (!skillMastery) {
    console.warn(
      "Skill Mastery category not found — courses will still be created without a track id."
    );
  }

  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
  let nextOrder = (maxOrder._max.order ?? 0) + 1;

  const results = [];
  for (const seed of COURSES) {
    const existing = before.find((course) => course.title === seed.title);
    const order = existing ? 0 : nextOrder;
    if (!existing) nextOrder += 1;
    results.push(
      await upsertCourse(prisma, seed, skillMastery?.id ?? null, order, publish)
    );
  }

  const after = await prisma.course.findMany({ select: { id: true } });
  const beforeIds = new Set(before.map((course) => course.id));
  const afterIds = new Set(after.map((course) => course.id));
  const removed = [...beforeIds].filter((id) => !afterIds.has(id));
  if (removed.length > 0) {
    throw new Error(`Abort: ${removed.length} existing course(s) disappeared. This should never happen.`);
  }

  console.log(production ? "Seeded specialty courses on production:" : "Seeded specialty courses:");
  for (const row of results) {
    console.log(
      `  ${row.created ? "NEW" : "updated"} · ${row.published ? "LIVE" : "draft"} · ${row.specialty} · ${row.title} (${row.lessons} lessons, ${row.questions} quiz questions)`
    );
  }
  console.log(`Course count ${before.length} → ${after.length} (no deletions).`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

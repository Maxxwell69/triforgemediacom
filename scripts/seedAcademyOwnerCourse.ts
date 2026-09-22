/**
 * Upserts Hub Zero Academy "How to Run Your Hub" (fills Getting Started if present).
 *
 *   npx tsx scripts/seedAcademyOwnerCourse.ts
 *   npx tsx scripts/seedAcademyOwnerCourse.ts --staging
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedAcademyOwnerCourse.ts --production
 */
import "dotenv/config";
import type { PrismaClient } from "@prisma/client";
import { lessonHtml } from "./specialtyCourseContent";
import {
  ACADEMY_OWNER_COURSE,
  ACADEMY_OWNER_COURSE_TITLES,
  ACADEMY_OWNER_MODULES,
} from "./academyOwnerCourseContent";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function findAcademyCourse(prisma: PrismaClient) {
  const titles = [...ACADEMY_OWNER_COURSE_TITLES];
  const exact = await prisma.course.findFirst({
    where: {
      hubOwnerOnly: true,
      OR: titles.map((title) => ({ title: { equals: title, mode: "insensitive" as const } })),
    },
    select: { id: true, title: true, isPublished: true, hubOwnerOnly: true },
  });
  if (exact) return exact;

  return prisma.course.create({
    data: {
      title: ACADEMY_OWNER_COURSE.title,
      description: ACADEMY_OWNER_COURSE.description,
      category: ACADEMY_OWNER_COURSE.category,
      isPublished: false,
      hubOwnerOnly: true,
    },
    select: { id: true, title: true, isPublished: true, hubOwnerOnly: true },
  });
}

async function upsert(prisma: PrismaClient) {
  const course = await findAcademyCourse(prisma);
  await prisma.course.update({
    where: { id: course.id },
    data: {
      title: ACADEMY_OWNER_COURSE.title,
      description: ACADEMY_OWNER_COURSE.description,
      category: ACADEMY_OWNER_COURSE.category,
      hubOwnerOnly: true,
    },
  });

  const results: string[] = [];
  const maxLesson = await prisma.lesson.aggregate({
    where: { courseId: course.id },
    _max: { order: true },
  });
  let nextOrder = (maxLesson._max.order ?? -1) + 1;

  for (let moduleIndex = 0; moduleIndex < ACADEMY_OWNER_MODULES.length; moduleIndex += 1) {
    const moduleSeed = ACADEMY_OWNER_MODULES[moduleIndex];
    const existingModule = await prisma.module.findFirst({
      where: { courseId: course.id, title: moduleSeed.title },
      select: { id: true },
    });
    const moduleRow = existingModule
      ? await prisma.module.update({
          where: { id: existingModule.id },
          data: { description: moduleSeed.description, order: moduleIndex },
        })
      : await prisma.module.create({
          data: {
            courseId: course.id,
            title: moduleSeed.title,
            description: moduleSeed.description,
            order: moduleIndex,
          },
        });

    results.push(`MODULE · ${moduleSeed.title} (${moduleSeed.lessons.length} lessons)`);
    for (let i = 0; i < moduleSeed.lessons.length; i += 1) {
      const lesson = moduleSeed.lessons[i];
      const found = await prisma.lesson.findFirst({
        where: { courseId: course.id, title: lesson.title },
        select: { id: true },
      });
      const lessonData = {
        title: lesson.title,
        content: lessonHtml(lesson, i),
        moduleId: moduleRow.id,
        videoUrl: null,
        xpValue: 15,
        exerciseXpBonus: 10,
      };
      if (found) {
        await prisma.lesson.update({ where: { id: found.id }, data: lessonData });
        results.push(`  updated · ${lesson.title}`);
      } else {
        await prisma.lesson.create({
          data: { courseId: course.id, order: nextOrder, ...lessonData },
        });
        nextOrder += 1;
        results.push(`  NEW · ${lesson.title}`);
      }
    }
  }

  return { course, results };
}

async function main() {
  const production = process.argv.includes("--production");
  if (process.argv.includes("--staging") && process.env.STAGING_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  }
  if (production) {
    const prodUrl = process.env.PRODUCTION_DATABASE_URL;
    if (!prodUrl) throw new Error("PRODUCTION_DATABASE_URL is not set.");
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
  const { controlPrisma: prisma } = await import("../lib/prismaControl");
  const { course, results } = await upsert(prisma);
  console.log(
    `${production ? "Production" : "Database"} · ${course.title} (${course.isPublished ? "LIVE" : "draft"}, academy)`
  );
  for (const line of results) console.log(line);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

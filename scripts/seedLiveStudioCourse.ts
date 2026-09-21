/**
 * Attaches every TikTok LIVE Studio module to the Hub 0 course.
 * Re-runnable: updates lessons by title. Does not delete unrelated modules.
 *
 *   npx tsx scripts/seedLiveStudioCourse.ts
 *   npx tsx scripts/seedLiveStudioCourse.ts --staging
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedLiveStudioCourse.ts --production
 */
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { PrismaClient } from "@prisma/client";
import { lessonHtml } from "./specialtyCourseContent";
import {
  LIVE_STUDIO_COURSE_TITLES,
  LIVE_STUDIO_LESSONS,
  LIVE_STUDIO_MODULE,
} from "./liveStudioCourseContent";
import { LIVE_STUDIO_IMPORTED_MODULES } from "./liveStudioModuleIndex";
import { loadLiveStudioModuleFromFile, type LiveStudioModuleSeed } from "./parseLiveStudioMarkdown";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

async function findLiveStudioCourse(prisma: PrismaClient) {
  const titles = [...LIVE_STUDIO_COURSE_TITLES];
  const exact = await prisma.course.findFirst({
    where: {
      OR: titles.map((title) => ({ title: { equals: title, mode: "insensitive" as const } })),
    },
    select: { id: true, title: true, isPublished: true, hubOwnerOnly: true },
  });
  if (exact) return exact;

  const all = await prisma.course.findMany({
    select: { id: true, title: true, isPublished: true, hubOwnerOnly: true },
    orderBy: { title: "asc" },
  });
  const fuzzy = all.find((row) => {
    const t = row.title.toLowerCase();
    return (
      t.includes("live studio") ||
      t.includes("tiktok live studio") ||
      (t.includes("tik tok live") && t.includes("studio"))
    );
  });
  if (fuzzy) return fuzzy;

  return prisma.course.create({
    data: {
      title: "Tik Tok Live Studio",
      description:
        "Desktop LIVE Studio: setup through first LIVE, visuals, sound, analytics, engagement, monetization, career, and Gaming Club.",
      category: "LIVE Studio",
      isPublished: false,
      hubOwnerOnly: false,
    },
    select: { id: true, title: true, isPublished: true, hubOwnerOnly: true },
  });
}

function loadImportedModules(): LiveStudioModuleSeed[] {
  const sourceDir = join(process.cwd(), "scripts", "live-studio-source");
  const mapPath = join(sourceDir, "image-map.json");
  const imageMap: Record<string, string> = existsSync(mapPath)
    ? JSON.parse(readFileSync(mapPath, "utf8"))
    : {};
  return LIVE_STUDIO_IMPORTED_MODULES.map((meta) =>
    loadLiveStudioModuleFromFile(join(sourceDir, meta.file), meta, imageMap)
  );
}

function allModules(): LiveStudioModuleSeed[] {
  return [
    {
      title: LIVE_STUDIO_MODULE.title,
      description: LIVE_STUDIO_MODULE.description,
      lessons: LIVE_STUDIO_LESSONS,
    },
    ...loadImportedModules(),
  ];
}

async function upsertModuleAndLessons(prisma: PrismaClient) {
  const course = await findLiveStudioCourse(prisma);
  await prisma.course.update({
    where: { id: course.id },
    data: {
      description:
        "Desktop LIVE Studio: setup through first LIVE, visuals, sound, analytics, engagement, monetization, career, and Gaming Club.",
    },
  });
  const modules = allModules();
  const results: string[] = [];

  const maxLesson = await prisma.lesson.aggregate({
    where: { courseId: course.id },
    _max: { order: true },
  });
  let nextOrder = (maxLesson._max.order ?? -1) + 1;

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const moduleSeed = modules[moduleIndex];
    const existingModule = await prisma.module.findFirst({
      where: { courseId: course.id, title: moduleSeed.title },
      select: { id: true, order: true },
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
        await prisma.lesson.update({
          where: { id: found.id },
          data: lessonData,
        });
        results.push(`  updated · ${lesson.title}`);
      } else {
        await prisma.lesson.create({
          data: {
            courseId: course.id,
            order: nextOrder,
            ...lessonData,
          },
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

  const { course, results } = await upsertModuleAndLessons(prisma);
  console.log(
    `${production ? "Production" : "Database"} · ${course.title} (${course.isPublished ? "LIVE" : "draft"}${course.hubOwnerOnly ? ", academy" : ""})`
  );
  for (const line of results) console.log(line);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

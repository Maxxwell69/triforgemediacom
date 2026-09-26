/**
 * Uploads Service+ screenshots to R2 and upserts the Hub 0 Learning Center course.
 *
 *   npx tsx scripts/seedServicePlusCourse.ts --publish
 *   npx tsx scripts/seedServicePlusCourse.ts --staging --publish
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedServicePlusCourse.ts --production --publish
 */
import "dotenv/config";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { PrismaClient } from "@prisma/client";
import { lessonHtml } from "./specialtyCourseContent";
import {
  SERVICEPLUS_BADGE_NAME,
  SERVICEPLUS_COURSE_TITLE,
  SERVICEPLUS_COURSE_TITLE_ALIASES,
  buildServicePlusCourse,
} from "./servicePlusCourseContent";
import { isR2Configured, uploadImage } from "../lib/r2";

const SOURCE_DIR = join(process.cwd(), "scripts", "serviceplus-source");
const IMAGE_DIR = join(SOURCE_DIR, "triforge-serviceplus-course", "images");
const MAP_PATH = join(SOURCE_DIR, "image-map.json");
const MODULE_TITLE = "Service+ Setup";
const ASSIGNMENT_TITLE = "Pin rhythm LIVE";
const ASSIGNMENT_INSTRUCTIONS =
  "Run one LIVE of 30+ minutes with at least 8 pins. Submit a screenshot of your Service+ Insights showing the stream.";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function loadImageMap(): Record<string, string> {
  if (!existsSync(MAP_PATH)) return {};
  return JSON.parse(readFileSync(MAP_PATH, "utf8")) as Record<string, string>;
}

async function uploadCourseImages(reupload: boolean): Promise<Record<string, string>> {
  const map = loadImageMap();
  if (!existsSync(IMAGE_DIR)) {
    if (Object.keys(map).length > 0) return map;
    throw new Error(`Missing Service+ images at ${IMAGE_DIR}. Extract the course zip first.`);
  }
  if (!isR2Configured()) {
    if (Object.keys(map).length > 0) {
      console.log("R2 not configured — using existing image-map.json URLs.");
      return map;
    }
    throw new Error("R2 is not configured and there is no image-map.json.");
  }

  const files = readdirSync(IMAGE_DIR).filter((name) => name.toLowerCase().endsWith(".png"));
  for (const file of files) {
    if (!reupload && map[file]) continue;
    const buffer = readFileSync(join(IMAGE_DIR, file));
    const stem = file.replace(/\.png$/i, "");
    const url = await uploadImage(
      "learn/serviceplus",
      { buffer, type: "image/png", size: buffer.length },
      { fileStem: stem }
    );
    map[file] = url;
    console.log(`  uploaded ${file}`);
  }

  writeFileSync(MAP_PATH, `${JSON.stringify(map, null, 2)}\n`);
  return map;
}

async function upsertCourse(
  prisma: PrismaClient,
  images: Record<string, string>,
  publish: boolean
) {
  const seed = buildServicePlusCourse(images);
  for (let i = 0; i < seed.lessons.length; i += 1) {
    lessonHtml(seed.lessons[i], i);
  }

  const [monetization, risingStar] = await Promise.all([
    prisma.progressionCategory.findFirst({ where: { name: "Monetization" }, select: { id: true } }),
    prisma.progressionLevel.findFirst({ where: { name: "Rising Star" }, select: { id: true } }),
  ]);

  const existing =
    (await prisma.course.findFirst({
      where: { title: SERVICEPLUS_COURSE_TITLE },
      select: { id: true, isPublished: true },
    })) ??
    (await prisma.course.findFirst({
      where: { title: { in: [...SERVICEPLUS_COURSE_TITLE_ALIASES] } },
      select: { id: true, isPublished: true },
    }));

  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
  const shared = {
    title: seed.title,
    description: seed.description,
    thumbnailUrl: images["course-serviceplus-icon.png"] ?? null,
    category: "Monetization",
    xpReward: 100,
    certificateEnabled: true,
    progressionEnabled: true,
    progressionCategoryId: monetization?.id ?? null,
    progressionLevelId: risingStar?.id ?? null,
    progressionSpecialty: null,
    hubOwnerOnly: false,
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
          order: (maxOrder._max.order ?? 0) + 1,
          isPublished: publish,
        },
      });

  const existingModule = await prisma.module.findFirst({
    where: { courseId: course.id, title: MODULE_TITLE },
    select: { id: true },
  });
  const courseModule = existingModule
    ? await prisma.module.update({
        where: { id: existingModule.id },
        data: { description: seed.description, order: 0, thumbnailUrl: shared.thumbnailUrl },
      })
    : await prisma.module.create({
        data: {
          courseId: course.id,
          title: MODULE_TITLE,
          description: seed.description,
          order: 0,
          thumbnailUrl: shared.thumbnailUrl,
        },
      });

  const lessonIds: string[] = [];
  for (let i = 0; i < seed.lessons.length; i += 1) {
    const lesson = seed.lessons[i];
    const found = await prisma.lesson.findFirst({
      where: { courseId: course.id, title: lesson.title },
      select: { id: true },
    });
    const isPractical = i === seed.lessons.length - 1;
    const lessonData = {
      title: lesson.title,
      order: i,
      content: lessonHtml(lesson, i),
      videoUrl: null,
      moduleId: courseModule.id,
      thumbnailUrl: i === 0 ? shared.thumbnailUrl : null,
      xpValue: 15,
      exerciseXpBonus: isPractical ? 50 : 10,
    };
    const row = found
      ? await prisma.lesson.update({ where: { id: found.id }, data: lessonData })
      : await prisma.lesson.create({ data: { courseId: course.id, ...lessonData } });
    lessonIds.push(row.id);
  }

  const practicalLessonId = lessonIds[lessonIds.length - 1];
  await prisma.assignment.upsert({
    where: { lessonId: practicalLessonId },
    create: {
      lessonId: practicalLessonId,
      title: ASSIGNMENT_TITLE,
      instructions: ASSIGNMENT_INSTRUCTIONS,
    },
    update: {
      title: ASSIGNMENT_TITLE,
      instructions: ASSIGNMENT_INSTRUCTIONS,
    },
  });

  const quiz = await prisma.quiz.upsert({
    where: { courseId: course.id },
    create: {
      courseId: course.id,
      title: "Service+ Setup — certification exam",
      passScore: 80,
    },
    update: {
      title: "Service+ Setup — certification exam",
      passScore: 80,
    },
  });

  await prisma.question.deleteMany({ where: { quizId: quiz.id } });
  for (let i = 0; i < seed.questions.length; i += 1) {
    const question = seed.questions[i];
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        type: question.type,
        text: question.text,
        options: question.options ?? [],
        correctAnswer: question.correct,
        order: i,
      },
    });
  }

  const badge =
    (await prisma.badge.findFirst({
      where: { name: SERVICEPLUS_BADGE_NAME },
      select: { id: true },
    })) ??
    (await prisma.badge.findFirst({
      where: { name: { contains: "Service+", mode: "insensitive" } },
      select: { id: true },
    }));
  if (badge) {
    await prisma.badge.update({
      where: { id: badge.id },
      data: {
        name: SERVICEPLUS_BADGE_NAME,
        courseId: course.id,
        description: "Completed Service+ Setup and passed the certification exam.",
        icon: "💼",
      },
    });
  } else {
    await prisma.badge.create({
      data: {
        name: SERVICEPLUS_BADGE_NAME,
        description: "Completed Service+ Setup and passed the certification exam.",
        icon: "💼",
        courseId: course.id,
      },
    });
  }

  return {
    id: course.id,
    created: !existing,
    published: course.isPublished,
    lessons: seed.lessons.length,
    questions: seed.questions.length,
    images: Object.keys(images).length,
  };
}

async function main() {
  const production = process.argv.includes("--production");
  const publish = process.argv.includes("--publish");
  const reupload = process.argv.includes("--reupload");

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

  console.log("Uploading Service+ screenshots…");
  const images = await uploadCourseImages(reupload);
  const course = await upsertCourse(prisma, images, publish);

  console.log(production ? "Seeded Service+ on production:" : "Seeded Service+ on Hub 0:");
  console.log(
    `  ${course.created ? "NEW" : "updated"} · ${course.published ? "LIVE" : "draft"} · ${SERVICEPLUS_COURSE_TITLE}`
  );
  console.log(
    `  ${course.lessons} lessons · ${course.questions} exam questions · pass 80 · badge ${SERVICEPLUS_BADGE_NAME} · ${course.images} images`
  );
  if (!publish && !course.published) {
    console.log("  Course is still a draft. Re-run with --publish to make it live in Learning Center.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Upserts Battle Hosts (5 lessons + certification exam),
 * the Battle Hosts badge, and the Battle Hosts group + channels.
 *
 *   npx tsx scripts/seedBattlesCourse.ts
 *   npx tsx scripts/seedBattlesCourse.ts --staging
 *   npx tsx scripts/seedBattlesCourse.ts --publish
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedBattlesCourse.ts --production --publish
 */
import "dotenv/config";
import type { PrismaClient } from "@prisma/client";
import { lessonHtml } from "./specialtyCourseContent";
import {
  BATTLES_BADGE_NAME,
  BATTLES_BADGE_NAME_ALIASES,
  BATTLES_CHANNELS,
  BATTLES_COURSE,
  BATTLES_COURSE_TITLE,
  BATTLES_COURSE_TITLE_ALIASES,
  BATTLES_GROUP_NAME,
  BATTLES_GROUP_NAME_ALIASES,
  BATTLES_MODULES,
} from "./battlesCourseContent";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const GROUP_DESCRIPTION =
  "Standing space for Battle Hosts running or training on TikTok LIVE Battles. Pair for practice matches and debrief after. Finish Lessons 1–2 of Battle Hosts before you apply so practice matches stay safe. Full certification (all five lessons + exam) auto-joins you and awards the Battle Hosts badge.";

async function upsertGroup(prisma: PrismaClient) {
  const groupInclude = { channels: { select: { id: true, name: true } } } as const;
  let group =
    (await prisma.group.findUnique({
      where: { name: BATTLES_GROUP_NAME },
      include: groupInclude,
    })) ??
    (await prisma.group.findFirst({
      where: { name: { in: [...BATTLES_GROUP_NAME_ALIASES] } },
      include: groupInclude,
    }));

  if (!group) {
    group = await prisma.group.create({
      data: {
        name: BATTLES_GROUP_NAME,
        description: GROUP_DESCRIPTION,
        color: "#FD4802",
        imageUrl: null,
        grantsTikTaskAccess: true,
        showInList: true,
        canCreateEvents: true,
        joinMode: "APPLY",
      },
      include: { channels: { select: { id: true, name: true } } },
    });
    console.log(`Created group: ${BATTLES_GROUP_NAME}`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: {
        name: BATTLES_GROUP_NAME,
        description: GROUP_DESCRIPTION,
        joinMode: "APPLY",
        showInList: true,
        canCreateEvents: true,
      },
      include: { channels: { select: { id: true, name: true } } },
    });
    console.log(`Updated group: ${BATTLES_GROUP_NAME}`);
  }

  for (const channel of BATTLES_CHANNELS) {
    const existing = group.channels.find((row) => row.name === channel.name);
    if (existing) {
      await prisma.channel.update({
        where: { id: existing.id },
        data: { description: channel.description },
      });
      console.log(`  channel #${channel.name} already attached`);
      continue;
    }
    await prisma.channel.create({
      data: {
        name: channel.name,
        description: channel.description,
        minRole: "MEMBER",
        groups: { connect: { id: group.id } },
      },
    });
    console.log(`  created #${channel.name}`);
  }

  return group.id;
}

async function upsertCourse(
  prisma: PrismaClient,
  groupId: string,
  publish: boolean
) {
  const [skillMastery, collab] = await Promise.all([
    prisma.progressionCategory.findFirst({ where: { name: "Skill Mastery" }, select: { id: true } }),
    prisma.progressionCategory.findFirst({ where: { name: "Collab" }, select: { id: true } }),
  ]);

  const existing =
    (await prisma.course.findFirst({
      where: { title: BATTLES_COURSE_TITLE },
      select: { id: true, isPublished: true },
    })) ??
    (await prisma.course.findFirst({
      where: { title: { in: [...BATTLES_COURSE_TITLE_ALIASES] } },
      select: { id: true, isPublished: true },
    }));

  const maxOrder = await prisma.course.aggregate({ _max: { order: true } });
  const shared = {
    title: BATTLES_COURSE.title,
    description: BATTLES_COURSE.description,
    category: "Skill Mastery",
    xpReward: BATTLES_COURSE.xpReward,
    certificateEnabled: true,
    progressionEnabled: true,
    progressionCategoryId: skillMastery?.id ?? collab?.id ?? null,
    progressionLevelId: null,
    progressionSpecialty: BATTLES_COURSE_TITLE,
    completionGroupId: groupId,
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

  const moduleIds: Record<string, string> = {};
  for (let i = 0; i < BATTLES_MODULES.length; i += 1) {
    const spec = BATTLES_MODULES[i];
    const found = await prisma.module.findFirst({
      where: { courseId: course.id, title: spec.title },
      select: { id: true },
    });
    const courseModule = found
      ? await prisma.module.update({
          where: { id: found.id },
          data: { order: i, description: spec.lessonTitles.join(" · ") },
        })
      : await prisma.module.create({
          data: {
            courseId: course.id,
            title: spec.title,
            description: spec.lessonTitles.join(" · "),
            order: i,
          },
        });
    moduleIds[spec.title] = courseModule.id;
  }

  const lessonToModule = new Map<string, string>();
  for (const spec of BATTLES_MODULES) {
    for (const title of spec.lessonTitles) {
      lessonToModule.set(title, moduleIds[spec.title]);
    }
  }

  for (let i = 0; i < BATTLES_COURSE.lessons.length; i += 1) {
    const lesson = BATTLES_COURSE.lessons[i];
    const found = await prisma.lesson.findFirst({
      where: { courseId: course.id, title: lesson.title },
      select: { id: true },
    });
    const lessonData = {
      title: lesson.title,
      order: i,
      content: lessonHtml(lesson, i),
      videoUrl: null,
      moduleId: lessonToModule.get(lesson.title) ?? null,
      xpValue: 15,
      exerciseXpBonus: 10,
    };
    if (found) {
      await prisma.lesson.update({ where: { id: found.id }, data: lessonData });
    } else {
      await prisma.lesson.create({ data: { courseId: course.id, ...lessonData } });
    }
  }

  // Hands-on submissions are off for now — keep lesson exercises as reading, not graded homework.
  await prisma.assignment.deleteMany({
    where: { lesson: { courseId: course.id } },
  });

  const quiz = await prisma.quiz.upsert({
    where: { courseId: course.id },
    create: {
      courseId: course.id,
      title: "Battle Hosts — certification exam",
      passScore: 75,
    },
    update: {
      title: "Battle Hosts — certification exam",
      passScore: 75,
    },
  });

  await prisma.question.deleteMany({ where: { quizId: quiz.id } });
  for (let i = 0; i < BATTLES_COURSE.questions.length; i += 1) {
    const question = BATTLES_COURSE.questions[i];
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

  const badge =
    (await prisma.badge.findFirst({
      where: { name: BATTLES_BADGE_NAME },
      select: { id: true },
    })) ??
    (await prisma.badge.findFirst({
      where: { name: { in: [...BATTLES_BADGE_NAME_ALIASES] } },
      select: { id: true },
    }));
  if (badge) {
    await prisma.badge.update({
      where: { id: badge.id },
      data: {
        name: BATTLES_BADGE_NAME,
        courseId: course.id,
        description: "Passed Battle Hosts. Collab-track Battle Hosts certification.",
        icon: "🥊",
      },
    });
  } else {
    await prisma.badge.create({
      data: {
        name: BATTLES_BADGE_NAME,
        description: "Passed Battle Hosts. Collab-track Battle Hosts certification.",
        icon: "🥊",
        courseId: course.id,
      },
    });
  }

  return {
    id: course.id,
    created: !existing,
    published: course.isPublished,
    lessons: BATTLES_COURSE.lessons.length,
    questions: BATTLES_COURSE.questions.length,
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

  const groupId = await upsertGroup(prisma);
  const course = await upsertCourse(prisma, groupId, publish);
  const { syncSpecialtySkills } = await import("../lib/progression/populate");
  await syncSpecialtySkills();

  console.log(
    production ? "Seeded Battle Hosts on production:" : "Seeded Battle Hosts:"
  );
  console.log(
    `  ${course.created ? "NEW" : "updated"} · ${course.published ? "LIVE" : "draft"} · ${BATTLES_COURSE_TITLE} (${course.lessons} lessons, ${course.questions} exam questions)`
  );
  console.log(`  group ${BATTLES_GROUP_NAME} · badge ${BATTLES_BADGE_NAME}`);
  if (!publish && !course.published) {
    console.log("  Course is still a draft. Re-run with --publish to make it live in Learning Center.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Apply official learning/mission point values, then award missing XP for
 * work already completed. Safe to re-run (skips XPEvent rows that exist).
 *
 *   npm run db:backfill-learning-points
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/backfillLearningPoints.ts --production
 */
import Module from "node:module";
import "dotenv/config";
import { certTierXpAward, awardXpOnce, awardLessonCompletionXp, awardQuizPassXp, POINT_DEFAULTS } from "../lib/xp";

// progression/engine.ts imports `server-only`; scripts need evaluateProgression.
const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load;
(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function (
  request: string,
  ...rest: unknown[]
) {
  if (request === "server-only") return {};
  return originalLoad.call(this, request, ...rest);
};

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
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
      throw new Error("Refusing production backfill without ALLOW_PROD_DB_OPS=yes.");
    }
    const prodHost = process.env.PROD_DB_HOST?.trim();
    const urlHost = extractHost(prodUrl);
    if (prodHost && urlHost && !urlHost.includes(prodHost)) {
      throw new Error(`PRODUCTION_DATABASE_URL host (${urlHost}) does not match PROD_DB_HOST (${prodHost}).`);
    }
    process.env.DATABASE_URL = prodUrl;
  }

  await import("./guardDb");
  const { prisma } = await import("../lib/prisma");
  const { populateOfficialProgression } = await import("../lib/progression/populate");
  const { evaluateProgression } = await import("../lib/progression/engine");

  console.log("Populating official missions / cert awards / skill awards…");
  await populateOfficialProgression();

  await prisma.course.updateMany({
    where: { xpReward: { lt: POINT_DEFAULTS.courseCompletion } },
    data: { xpReward: POINT_DEFAULTS.courseCompletion },
  });
  await prisma.progressionSettings.updateMany({
    data: {
      streak3Xp: POINT_DEFAULTS.streak3,
      streak7Xp: POINT_DEFAULTS.streak7,
      streak30Xp: POINT_DEFAULTS.streak30,
      microDailyCap: POINT_DEFAULTS.microDailyCap,
      standardDailyCap: POINT_DEFAULTS.standardDailyCap,
    },
  });

  const counts = { lessons: 0, quizzes: 0, courses: 0, certs: 0, skills: 0, missions: 0, streaks: 0 };
  const usersToEvaluate = new Set<string>();

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { completedAt: { not: null } },
    include: {
      lesson: {
        include: {
          assignment: { select: { id: true } },
          course: { select: { progressionCategoryId: true } },
        },
      },
    },
  });
  for (const row of lessonProgress) {
    const awarded = await awardLessonCompletionXp(prisma, row.userId, row.lesson);
    if (awarded) {
      counts.lessons += 1;
      usersToEvaluate.add(row.userId);
    }
  }

  const passedAttempts = await prisma.quizAttempt.findMany({
    where: { passed: true },
    include: { quiz: { include: { course: { select: { progressionCategoryId: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const quizAwarded = new Set<string>();
  for (const attempt of passedAttempts) {
    const key = `${attempt.userId}:${attempt.quizId}`;
    if (quizAwarded.has(key)) continue;
    quizAwarded.add(key);
    const awarded = await awardQuizPassXp(prisma, attempt.userId, attempt.quiz, attempt.score);
    if (awarded) {
      counts.quizzes += 1;
      usersToEvaluate.add(attempt.userId);
    }
  }

  const completedEnrollments = await prisma.enrollment.findMany({
    where: { completedAt: { not: null } },
    include: { course: { select: { xpReward: true, progressionCategoryId: true } } },
  });
  for (const enrollment of completedEnrollments) {
    const bonus = enrollment.course.xpReward || POINT_DEFAULTS.courseCompletion;
    const existing = await prisma.xPEvent.findFirst({
      where: { userId: enrollment.userId, source: "COURSE_COMPLETION", refId: enrollment.id },
    });
    if (!existing) {
      const awarded = await awardXpOnce(prisma, {
        userId: enrollment.userId,
        amount: bonus,
        source: "COURSE_COMPLETION",
        refId: enrollment.id,
        note: "Module completion bonus",
        categoryId: enrollment.course.progressionCategoryId,
      });
      if (awarded) {
        counts.courses += 1;
        usersToEvaluate.add(enrollment.userId);
      }
      continue;
    }
    const missing = bonus - existing.amount;
    if (missing > 0) {
      const topped = await awardXpOnce(prisma, {
        userId: enrollment.userId,
        amount: missing,
        source: "COURSE_COMPLETION",
        refId: `${enrollment.id}:topup`,
        note: "Module completion bonus top-up",
        categoryId: enrollment.course.progressionCategoryId,
      });
      if (topped) {
        counts.courses += 1;
        usersToEvaluate.add(enrollment.userId);
      }
    }
  }

  const held = await prisma.progressionCertificationHeld.findMany({
    include: {
      certification: { include: { tiers: { orderBy: { sortOrder: "asc" } } } },
      tier: true,
    },
  });
  for (const row of held) {
    const currentSort = row.tier.sortOrder;
    for (const tier of row.certification.tiers) {
      if (tier.sortOrder > currentSort) continue;
      const awarded = await awardXpOnce(prisma, {
        userId: row.userId,
        amount: tier.xpAward || certTierXpAward(tier.name),
        source: "CERT_TIER",
        refId: tier.id,
        note: `${row.certification.name} · ${tier.name}`,
        categoryId: row.certification.categoryId,
      });
      if (awarded) {
        counts.certs += 1;
        usersToEvaluate.add(row.userId);
      }
    }
  }

  const unlocks = await prisma.progressionSkillUnlock.findMany({
    include: { skill: true },
  });
  for (const row of unlocks) {
    const awarded = await awardXpOnce(prisma, {
      userId: row.userId,
      amount: row.skill.xpAward || POINT_DEFAULTS.skillUnlock,
      source: "SKILL_UNLOCK",
      refId: row.skillId,
      note: row.skill.name,
      categoryId: row.skill.categoryId,
    });
    if (awarded) {
      counts.skills += 1;
      usersToEvaluate.add(row.userId);
    }
  }

  const completions = await prisma.progressionMissionCompletion.findMany({
    include: { mission: { select: { name: true, xpValue: true, categoryId: true } } },
  });
  for (const row of completions) {
    const alreadyPaid = row.xpAwarded;
    if (alreadyPaid > 0) {
      const awarded = await awardXpOnce(prisma, {
        userId: row.userId,
        amount: alreadyPaid,
        source: "MISSION_COMPLETION",
        refId: row.id,
        note: row.mission.name,
      });
      if (awarded) {
        counts.missions += 1;
        usersToEvaluate.add(row.userId);
      }
    }
    const missing = row.mission.xpValue - alreadyPaid;
    if (missing > 0) {
      await prisma.progressionMissionCompletion.update({
        where: { id: row.id },
        data: { xpAwarded: row.mission.xpValue },
      });
      const topped = await awardXpOnce(prisma, {
        userId: row.userId,
        amount: missing,
        source: "MISSION_COMPLETION",
        refId: `${row.id}:topup`,
        note: `${row.mission.name} point-value top-up`,
        categoryId: row.mission.categoryId,
      });
      if (topped) {
        counts.missions += 1;
        usersToEvaluate.add(row.userId);
      }
    }
  }

  const settings = await prisma.progressionSettings.findUnique({ where: { id: "default" } });
  const streak3 = settings?.streak3Xp ?? POINT_DEFAULTS.streak3;
  const streak7 = settings?.streak7Xp ?? POINT_DEFAULTS.streak7;
  const streak30 = settings?.streak30Xp ?? POINT_DEFAULTS.streak30;
  const profiles = await prisma.profile.findMany({
    where: { streakCount: { gte: 3 } },
    select: { userId: true, streakCount: true },
  });
  for (const profile of profiles) {
    const bonuses: { days: number; amount: number }[] = [{ days: 3, amount: streak3 }];
    if (profile.streakCount >= 7) bonuses.push({ days: 7, amount: streak7 });
    if (profile.streakCount >= 30) bonuses.push({ days: 30, amount: streak30 });
    for (const bonus of bonuses) {
      const awarded = await awardXpOnce(prisma, {
        userId: profile.userId,
        amount: bonus.amount,
        source: "STREAK_BONUS",
        refId: `streak-${bonus.days}-current`,
        note: `${bonus.days}-day streak`,
      });
      if (awarded) {
        counts.streaks += 1;
      }
    }
  }

  const ladderProfiles = await prisma.progressionProfile.findMany({ select: { userId: true } });
  for (const row of ladderProfiles) usersToEvaluate.add(row.userId);

  console.log(`Evaluating progression for ${usersToEvaluate.size} members…`);
  for (const userId of usersToEvaluate) {
    await evaluateProgression(userId).catch((err) => {
      console.error(`evaluateProgression failed for ${userId}`, err);
    });
  }

  console.log("Backfill complete:", counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

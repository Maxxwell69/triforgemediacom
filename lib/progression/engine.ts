import "server-only";

import { prisma } from "@/lib/prisma";

export async function ensureProgressionProfile(userId: string) {
  return prisma.progressionProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function totalProgressionXp(userId: string): Promise<number> {
  const rows = await prisma.progressionCategoryXp.findMany({
    where: { userId },
    select: { amount: true },
  });
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function grantProgressionBadges(
  userId: string,
  trigger: "LEVEL" | "MISSION" | "CERTIFICATION" | "SKILL",
  triggerId: string
) {
  const badges = await prisma.progressionBadge.findMany({
    where: { status: "ACTIVE", trigger, triggerId },
  });
  for (const badge of badges) {
    await prisma.progressionBadgeGrant.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }
}

function periodStart(recurrence: "DAILY" | "WEEKLY"): Date {
  const now = new Date();
  if (recurrence === "DAILY") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return start;
}

export async function categoryUnlockMessage(userId: string, categoryId: string): Promise<string | null> {
  const category = await prisma.progressionCategory.findUnique({
    where: { id: categoryId },
    include: { unlockAtLevel: true },
  });
  if (!category?.unlockAtLevel) return null;
  const profile = await prisma.progressionProfile.findUnique({
    where: { userId },
    include: { currentLevel: true },
  });
  const currentSort = profile?.currentLevel?.sortOrder ?? -1;
  if (currentSort >= category.unlockAtLevel.sortOrder) return null;
  return `Unlocks at ${category.unlockAtLevel.name}`;
}

export async function canCompleteMission(userId: string, missionId: string): Promise<string | null> {
  const mission = await prisma.progressionMission.findUnique({ where: { id: missionId } });
  if (!mission || mission.status !== "ACTIVE") return "Mission is not available";
  const locked = await categoryUnlockMessage(userId, mission.categoryId);
  if (locked) return locked;
  if (mission.recurrence === "REPEATABLE") return null;

  const last = await prisma.progressionMissionCompletion.findFirst({
    where: { userId, missionId },
    orderBy: { completedAt: "desc" },
  });
  if (!last) return null;
  if (mission.recurrence === "ONE_TIME") return "Already completed";
  const start = periodStart(mission.recurrence);
  if (last.completedAt >= start) {
    return mission.recurrence === "DAILY" ? "Already completed today" : "Already completed this week";
  }
  return null;
}

export async function completeMission(userId: string, missionId: string) {
  const blocked = await canCompleteMission(userId, missionId);
  if (blocked) throw new Error(blocked);
  const mission = await prisma.progressionMission.findUnique({ where: { id: missionId } });
  if (!mission) throw new Error("Mission not found");

  await prisma.$transaction(async (tx) => {
    await tx.progressionMissionCompletion.create({
      data: { userId, missionId, xpAwarded: mission.xpValue },
    });
    await tx.progressionCategoryXp.upsert({
      where: { userId_categoryId: { userId, categoryId: mission.categoryId } },
      create: { userId, categoryId: mission.categoryId, amount: mission.xpValue },
      update: { amount: { increment: mission.xpValue } },
    });
  });

  await grantProgressionBadges(userId, "MISSION", missionId);
  await evaluateProgression(userId);
}

export async function completeLearningModule(userId: string, moduleId: string) {
  const learnModule = await prisma.progressionLearningModule.findUnique({
    where: { id: moduleId },
    include: { quiz: true },
  });
  if (!learnModule || learnModule.status !== "ACTIVE") throw new Error("Module is not available");
  const locked = await categoryUnlockMessage(userId, learnModule.categoryId);
  if (locked) throw new Error(locked);
  if (learnModule.quiz) {
    const passed = await prisma.progressionQuizAttempt.findFirst({
      where: { userId, quizId: learnModule.quiz.id, passed: true },
    });
    if (!passed) throw new Error("Pass the quiz first");
  }
  await prisma.progressionModuleCompletion.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    create: { userId, moduleId },
    update: {},
  });
  await evaluateProgression(userId);
}

export async function submitProgressionQuiz(userId: string, quizId: string, answers: number[]) {
  const quiz = await prisma.progressionQuiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { sortOrder: "asc" } }, module: true },
  });
  if (!quiz) throw new Error("Quiz not found");
  const locked = await categoryUnlockMessage(userId, quiz.module.categoryId);
  if (locked) throw new Error(locked);
  if (quiz.questions.length === 0) throw new Error("Quiz has no questions");

  let correct = 0;
  quiz.questions.forEach((question, index) => {
    if (answers[index] === question.correctIndex) correct += 1;
  });
  const score = Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passThreshold;

  await prisma.progressionQuizAttempt.create({
    data: { userId, quizId, score, passed },
  });
  if (passed) {
    await prisma.progressionModuleCompletion.upsert({
      where: { userId_moduleId: { userId, moduleId: quiz.moduleId } },
      create: { userId, moduleId: quiz.moduleId },
      update: {},
    });
    await evaluateProgression(userId);
  }
  return { score, passed, threshold: quiz.passThreshold };
}

export async function evaluateProgression(userId: string) {
  await ensureProgressionProfile(userId);
  await evaluateCertifications(userId);
  await evaluateSkills(userId);
  await evaluateLevel(userId);
}

async function evaluateCertifications(userId: string) {
  const certs = await prisma.progressionCertification.findMany({
    where: { status: "ACTIVE" },
    include: { tiers: { orderBy: { sortOrder: "asc" } }, category: true },
  });
  const xpRows = await prisma.progressionCategoryXp.findMany({ where: { userId } });
  const xpByCategory = new Map(xpRows.map((row) => [row.categoryId, row.amount]));
  const held = await prisma.progressionCertificationHeld.findMany({ where: { userId } });
  const heldByCert = new Map(held.map((row) => [row.certificationId, row]));

  for (const cert of certs) {
    for (const tier of cert.tiers) {
      if (tier.unlockKind === "ADMIN_REVIEW") continue;
      let ok = false;
      if (tier.unlockKind === "CATEGORY_XP") {
        ok = (xpByCategory.get(cert.categoryId) ?? 0) >= (tier.xpRequired ?? 0);
      } else if (tier.unlockKind === "QUIZ_PASSED") {
        const modules = await prisma.progressionLearningModule.findMany({
          where: { categoryId: cert.categoryId, status: "ACTIVE", quiz: { isNot: null } },
          select: { quiz: { select: { id: true } } },
        });
        const quizIds = modules.map((m) => m.quiz?.id).filter(Boolean) as string[];
        if (quizIds.length > 0) {
          const pass = await prisma.progressionQuizAttempt.findFirst({
            where: { userId, quizId: { in: quizIds }, passed: true },
          });
          ok = !!pass;
        }
      }
      if (!ok) continue;
      const current = heldByCert.get(cert.id);
      if (!current) {
        await prisma.progressionCertificationHeld.create({
          data: { userId, certificationId: cert.id, tierId: tier.id },
        });
        heldByCert.set(cert.id, {
          id: "",
          userId,
          certificationId: cert.id,
          tierId: tier.id,
          reviewedById: null,
          awardedAt: new Date(),
        });
        await grantProgressionBadges(userId, "CERTIFICATION", cert.id);
        await grantProgressionBadges(userId, "CERTIFICATION", tier.id);
      } else if (current.tierId !== tier.id) {
        const currentTier = cert.tiers.find((t) => t.id === current.tierId);
        if ((currentTier?.sortOrder ?? -1) < tier.sortOrder) {
          await prisma.progressionCertificationHeld.update({
            where: { userId_certificationId: { userId, certificationId: cert.id } },
            data: { tierId: tier.id },
          });
          await grantProgressionBadges(userId, "CERTIFICATION", tier.id);
        }
      }
    }
  }
}

async function evaluateSkills(userId: string) {
  const skills = await prisma.progressionSkill.findMany({ where: { status: "ACTIVE" } });
  const profile = await prisma.progressionProfile.findUnique({ where: { userId } });
  const xpRows = await prisma.progressionCategoryXp.findMany({ where: { userId } });
  const held = await prisma.progressionCertificationHeld.findMany({
    where: { userId },
    include: { tier: true },
  });
  const totalXp = xpRows.reduce((sum, row) => sum + row.amount, 0);

  for (const skill of skills) {
    let ok = false;
    if (skill.unlockKind === "MANUAL") continue;
    if (skill.unlockKind === "LEVEL") {
      if (skill.levelId && profile?.currentLevelId) {
        const [needed, current] = await Promise.all([
          prisma.progressionLevel.findUnique({ where: { id: skill.levelId }, select: { sortOrder: true } }),
          prisma.progressionLevel.findUnique({
            where: { id: profile.currentLevelId },
            select: { sortOrder: true },
          }),
        ]);
        ok = (current?.sortOrder ?? -1) >= (needed?.sortOrder ?? 9999);
      }
    } else if (skill.unlockKind === "CATEGORY_XP") {
      const amount = skill.categoryId
        ? (xpRows.find((row) => row.categoryId === skill.categoryId)?.amount ?? 0)
        : totalXp;
      ok = amount >= (skill.xpRequired ?? 0);
    } else if (skill.unlockKind === "CERTIFICATION") {
      const row = held.find((item) => item.certificationId === skill.certificationId);
      if (!row) {
        ok = false;
      } else if (skill.certTierId) {
        const needed = await prisma.progressionCertTier.findUnique({
          where: { id: skill.certTierId },
          select: { sortOrder: true },
        });
        ok = row.tier.sortOrder >= (needed?.sortOrder ?? 0);
      } else {
        ok = true;
      }
    }
    if (!ok) continue;
    const created = await prisma.progressionSkillUnlock.upsert({
      where: { userId_skillId: { userId, skillId: skill.id } },
      create: { userId, skillId: skill.id },
      update: {},
    });
    if (created) await grantProgressionBadges(userId, "SKILL", skill.id);
  }
}

async function evaluateLevel(userId: string) {
  const levels = await prisma.progressionLevel.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
    include: {
      milestones: true,
      certRequirements: { include: { tier: true } },
    },
  });
  const totalXp = await totalProgressionXp(userId);
  const completions = await prisma.progressionMissionCompletion.findMany({
    where: { userId },
    select: { missionId: true },
  });
  const doneMissions = new Set(completions.map((row) => row.missionId));
  const certs = await prisma.progressionCertificationHeld.findMany({
    where: { userId },
    include: { tier: true },
  });
  const heldByCert = new Map(certs.map((row) => [row.certificationId, row]));

  let currentId: string | null = null;
  for (const level of levels) {
    const xpOk = totalXp >= level.xpRequired;
    const milestonesOk =
      level.milestones.length === 0
        ? true
        : level.milestoneMode === "ANY"
          ? level.milestones.some((m) => doneMissions.has(m.missionId))
          : level.milestones.every((m) => doneMissions.has(m.missionId));
    const certsOk = level.certRequirements.every((req) => {
      const held = heldByCert.get(req.certificationId);
      if (!held) return false;
      if (!req.tier) return true;
      return held.tier.sortOrder >= req.tier.sortOrder;
    });
    if (xpOk && milestonesOk && certsOk) {
      currentId = level.id;
    } else {
      break;
    }
  }

  await prisma.progressionProfile.update({
    where: { userId },
    data: { currentLevelId: currentId },
  });
  if (currentId) await grantProgressionBadges(userId, "LEVEL", currentId);
}

export async function loadCreatorProgress(userId: string) {
  await ensureProgressionProfile(userId);
  await evaluateProgression(userId);

  const [profile, levels, categories, skills, badges, xpRows, missionsDone, modulesDone, certsHeld, skillsHeld, badgesHeld] =
    await Promise.all([
      prisma.progressionProfile.findUnique({
        where: { userId },
        include: { currentLevel: true },
      }),
      prisma.progressionLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: { milestones: true, certRequirements: true },
      }),
      prisma.progressionCategory.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: {
          unlockAtLevel: true,
          missions: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } },
          modules: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, include: { quiz: true } },
          certifications: {
            where: { status: "ACTIVE" },
            include: { tiers: { orderBy: { sortOrder: "asc" } } },
          },
        },
      }),
      prisma.progressionSkill.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
      prisma.progressionBadge.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } }),
      prisma.progressionCategoryXp.findMany({ where: { userId } }),
      prisma.progressionMissionCompletion.findMany({ where: { userId } }),
      prisma.progressionModuleCompletion.findMany({ where: { userId } }),
      prisma.progressionCertificationHeld.findMany({
        where: { userId },
        include: { tier: true, certification: true },
      }),
      prisma.progressionSkillUnlock.findMany({ where: { userId } }),
      prisma.progressionBadgeGrant.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ]);

  return {
    profile,
    levels,
    categories,
    skills,
    badges,
    totalXp: xpRows.reduce((sum, row) => sum + row.amount, 0),
    xpByCategory: Object.fromEntries(xpRows.map((row) => [row.categoryId, row.amount])),
    missionCompletions: missionsDone,
    moduleCompletions: modulesDone,
    certsHeld,
    skillsHeld,
    badgesHeld,
  };
}

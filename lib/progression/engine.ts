import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureOfficialProgression } from "@/lib/progression/populate";
import {
  isSpecializeMissionName,
  trackNameFromMission,
  SPECIALTY_UNLOCK_LEVEL,
  isSpecialtyTrackName,
  SPECIALTY_TRACK_NAMES,
  groupNamesForSpecialty,
} from "@/lib/progression/tracks";
import { awardXpOnce, certTierXpAward, POINT_DEFAULTS } from "@/lib/xp";
import { getOrCreateProgressionSettings } from "@/lib/progression/settings";

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

async function getChosenSpecialties(userId: string) {
  const completions = await prisma.progressionMissionCompletion.findMany({
    where: { userId },
    select: { missionId: true, mission: { select: { id: true, name: true } } },
    orderBy: { completedAt: "asc" },
  });
  return completions
    .filter((row) => isSpecializeMissionName(row.mission.name))
    .map((row) => ({
      missionId: row.mission.id,
      track: trackNameFromMission(row.mission.name),
    }));
}

async function specialtyUnlockLevel() {
  return prisma.progressionLevel.findFirst({
    where: { status: "ACTIVE", name: SPECIALTY_UNLOCK_LEVEL },
    orderBy: { sortOrder: "asc" },
  });
}

/** Join the hub space that matches a specialty (Gamer → Gaming). */
export async function grantSpecialtyGroupAccess(userId: string, track: string) {
  if (!isSpecialtyTrackName(track)) return;
  const names = groupNamesForSpecialty(track);
  const groups = await prisma.group.findMany({
    where: { name: { in: names }, isHome: false },
    select: { id: true },
  });
  await Promise.all(
    groups.map((group) =>
      prisma.groupMember.upsert({
        where: { userId_groupId: { userId, groupId: group.id } },
        update: {},
        create: { userId, groupId: group.id, role: "MEMBER" },
      })
    )
  );
}

/** Backfill group access for specialties already chosen. */
export async function syncSpecialtyGroupAccess(userId: string) {
  const chosen = await getChosenSpecialties(userId);
  if (chosen.length === 0) return;
  for (const row of chosen) {
    await grantSpecialtyGroupAccess(userId, row.track);
  }
}

export async function chooseSpecialty(userId: string, missionId: string) {
  const mission = await prisma.progressionMission.findUnique({ where: { id: missionId } });
  if (!mission || mission.status !== "ACTIVE" || !isSpecializeMissionName(mission.name)) {
    throw new Error("That specialty is not available");
  }
  const locked = await categoryUnlockMessage(userId, mission.categoryId);
  if (locked) throw new Error(locked);

  const profile = await prisma.progressionProfile.findUnique({
    where: { userId },
    include: { currentLevel: true },
  });
  const unlock = await specialtyUnlockLevel();
  const currentSort = profile?.currentLevel?.sortOrder ?? -1;
  if (unlock && currentSort < unlock.sortOrder) {
    throw new Error(`Specialty unlocks at ${unlock.name}`);
  }

  await completeMission(userId, missionId);
}

export async function resetSpecialty(userId: string) {
  const missions = await prisma.progressionMission.findMany({
    where: { name: { startsWith: "Specialize: " } },
    select: { id: true, categoryId: true },
  });
  const missionIds = missions.map((mission) => mission.id);
  if (missionIds.length === 0) return false;

  const completions = await prisma.progressionMissionCompletion.findMany({
    where: { userId, missionId: { in: missionIds } },
    select: { missionId: true, xpAwarded: true },
  });
  if (completions.length === 0) return false;

  const xpByCategory = new Map<string, number>();
  for (const row of completions) {
    const mission = missions.find((item) => item.id === row.missionId);
    if (!mission) continue;
    xpByCategory.set(mission.categoryId, (xpByCategory.get(mission.categoryId) ?? 0) + row.xpAwarded);
  }

  const specialtySkills = await prisma.progressionSkill.findMany({
    where: { name: { in: [...SPECIALTY_TRACK_NAMES] } },
    select: { id: true },
  });
  const skillIds = specialtySkills.map((skill) => skill.id);
  const deepDives = await prisma.progressionLearningModule.findMany({
    where: { title: { startsWith: "Skill Mastery Deep-Dive" } },
    select: { id: true, quiz: { select: { id: true } } },
  });
  const moduleIds = deepDives.map((row) => row.id);
  const quizIds = deepDives.map((row) => row.quiz?.id).filter((id): id is string => !!id);
  const specialtyBadges = await prisma.progressionBadge.findMany({
    where: {
      OR: [
        { trigger: "MISSION", triggerId: { in: missionIds } },
        ...(skillIds.length > 0
          ? [{ trigger: "SKILL" as const, triggerId: { in: skillIds } }]
          : []),
      ],
    },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.progressionMissionCompletion.deleteMany({
      where: { userId, missionId: { in: missionIds } },
    });
    for (const [categoryId, amount] of Array.from(xpByCategory.entries())) {
      const current = await tx.progressionCategoryXp.findUnique({
        where: { userId_categoryId: { userId, categoryId } },
      });
      if (!current) continue;
      await tx.progressionCategoryXp.update({
        where: { userId_categoryId: { userId, categoryId } },
        data: { amount: Math.max(0, current.amount - amount) },
      });
    }
    if (skillIds.length > 0) {
      await tx.progressionSkillUnlock.deleteMany({
        where: { userId, skillId: { in: skillIds } },
      });
    }
    if (specialtyBadges.length > 0) {
      await tx.progressionBadgeGrant.deleteMany({
        where: { userId, badgeId: { in: specialtyBadges.map((badge) => badge.id) } },
      });
    }
    if (moduleIds.length > 0) {
      await tx.progressionModuleCompletion.deleteMany({
        where: { userId, moduleId: { in: moduleIds } },
      });
    }
    if (quizIds.length > 0) {
      await tx.progressionQuizAttempt.deleteMany({
        where: { userId, quizId: { in: quizIds } },
      });
    }
  });

  await evaluateProgression(userId);
  return true;
}

export async function completeMission(userId: string, missionId: string) {
  const blocked = await canCompleteMission(userId, missionId);
  if (blocked) throw new Error(blocked);
  const mission = await prisma.progressionMission.findUnique({ where: { id: missionId } });
  if (!mission) throw new Error("Mission not found");

  let amount = mission.xpValue;
  if (mission.tier === "MICRO" || mission.tier === "STANDARD") {
    const settings = await getOrCreateProgressionSettings();
    const cap = mission.tier === "MICRO" ? settings.microDailyCap : settings.standardDailyCap;
    const start = periodStart("DAILY");
    const today = await prisma.progressionMissionCompletion.findMany({
      where: {
        userId,
        completedAt: { gte: start },
        mission: { categoryId: mission.categoryId, tier: mission.tier },
      },
      select: { xpAwarded: true },
    });
    const used = today.reduce((sum, row) => sum + row.xpAwarded, 0);
    amount = Math.max(0, Math.min(amount, cap - used));
  }

  await prisma.$transaction(async (tx) => {
    const completion = await tx.progressionMissionCompletion.create({
      data: { userId, missionId, xpAwarded: amount },
    });
    await awardXpOnce(tx, {
      userId,
      amount,
      source: "MISSION_COMPLETION",
      refId: completion.id,
      note: mission.name,
      categoryId: mission.categoryId,
    });
  });

  await grantProgressionBadges(userId, "MISSION", missionId);
  await evaluateProgression(userId);
  if (isSpecializeMissionName(mission.name)) {
    await grantSpecialtyGroupAccess(userId, trackNameFromMission(mission.name));
  }
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

async function hasPassedCategoryTeaching(userId: string, categoryId: string): Promise<boolean> {
  const courses = await prisma.course.findMany({
    where: { progressionEnabled: true, isPublished: true, progressionCategoryId: categoryId },
    select: { id: true, quiz: { select: { id: true } } },
  });
  for (let i = 0; i < courses.length; i += 1) {
    const course = courses[i];
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { completedAt: true },
    });
    if (enrollment?.completedAt) return true;
    if (course.quiz) {
      const passed = await prisma.quizAttempt.findFirst({
        where: { userId, quizId: course.quiz.id, passed: true },
        select: { id: true },
      });
      if (passed) return true;
    }
  }

  const shells = await prisma.progressionLearningModule.findMany({
    where: { categoryId, status: "ACTIVE", quiz: { isNot: null } },
    select: { quiz: { select: { id: true } } },
  });
  const quizIds = shells.map((row) => row.quiz?.id).filter(Boolean) as string[];
  if (quizIds.length === 0) return false;
  const pass = await prisma.progressionQuizAttempt.findFirst({
    where: { userId, quizId: { in: quizIds }, passed: true },
    select: { id: true },
  });
  return !!pass;
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
        ok = await hasPassedCategoryTeaching(userId, cert.categoryId);
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
        await awardXpOnce(prisma, {
          userId,
          amount: tier.xpAward || certTierXpAward(tier.name),
          source: "CERT_TIER",
          refId: tier.id,
          note: `${cert.name} · ${tier.name}`,
          categoryId: cert.categoryId,
        });
      } else if (current.tierId !== tier.id) {
        const currentTier = cert.tiers.find((t) => t.id === current.tierId);
        if ((currentTier?.sortOrder ?? -1) < tier.sortOrder) {
          await prisma.progressionCertificationHeld.update({
            where: { userId_certificationId: { userId, certificationId: cert.id } },
            data: { tierId: tier.id },
          });
          await grantProgressionBadges(userId, "CERTIFICATION", tier.id);
          await awardXpOnce(prisma, {
            userId,
            amount: tier.xpAward || certTierXpAward(tier.name),
            source: "CERT_TIER",
            refId: tier.id,
            note: `${cert.name} · ${tier.name}`,
            categoryId: cert.categoryId,
          });
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

  const chosenTracks = new Set((await getChosenSpecialties(userId)).map((row) => row.track));

  for (const skill of skills) {
    let ok = false;
    if (isSpecialtyTrackName(skill.name)) {
      ok = chosenTracks.has(skill.name);
    } else if (skill.unlockKind === "MANUAL") {
      continue;
    } else if (skill.unlockKind === "LEVEL") {
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
    const existingUnlock = await prisma.progressionSkillUnlock.findUnique({
      where: { userId_skillId: { userId, skillId: skill.id } },
      select: { id: true },
    });
    if (!existingUnlock) {
      await prisma.progressionSkillUnlock.create({
        data: { userId, skillId: skill.id },
      });
      await grantProgressionBadges(userId, "SKILL", skill.id);
      await awardXpOnce(prisma, {
        userId,
        amount: skill.xpAward || POINT_DEFAULTS.skillUnlock,
        source: "SKILL_UNLOCK",
        refId: skill.id,
        note: skill.name,
        categoryId: skill.categoryId,
      });
    }
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

  const profile = await prisma.progressionProfile.findUnique({
    where: { userId },
    select: { adminPlacedLevelId: true },
  });
  if (profile?.adminPlacedLevelId) {
    const earnedIndex = levels.findIndex((level) => level.id === currentId);
    const placedIndex = levels.findIndex((level) => level.id === profile.adminPlacedLevelId);
    if (placedIndex >= 0 && placedIndex > earnedIndex) {
      currentId = profile.adminPlacedLevelId;
    }
  }

  await prisma.progressionProfile.update({
    where: { userId },
    data: { currentLevelId: currentId },
  });
  if (currentId) await grantProgressionBadges(userId, "LEVEL", currentId);
}

export async function loadCreatorProgress(userId: string) {
  await ensureOfficialProgression();
  await ensureProgressionProfile(userId);
  await evaluateProgression(userId);

  const [profile, levels, categories, skills, badges, xpRows, missionsDone, modulesDone, certsHeld, skillsHeld, badgesHeld] =
    await Promise.all([
      prisma.progressionProfile.findUnique({
        where: { userId },
        include: { currentLevel: true, adminPlacedLevel: true },
      }),
      prisma.progressionLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: {
          milestones: { include: { mission: { select: { id: true, name: true } } } },
          certRequirements: {
            include: {
              certification: { select: { id: true, name: true } },
              tier: { select: { id: true, name: true, sortOrder: true } },
            },
          },
        },
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

  const teachingCourses = await prisma.course.findMany({
    where: { progressionEnabled: true, isPublished: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      progressionCategoryId: true,
      progressionLevelId: true,
      progressionSpecialty: true,
      progressionLevel: { select: { id: true, name: true, sortOrder: true } },
      quiz: { select: { id: true } },
    },
  });
  const teachingIds = teachingCourses.map((course) => course.id);
  const [courseEnrollments, courseQuizPasses] = await Promise.all([
    teachingIds.length
      ? prisma.enrollment.findMany({
          where: { userId, courseId: { in: teachingIds } },
          select: { courseId: true, completedAt: true },
        })
      : Promise.resolve([]),
    teachingIds.length
      ? prisma.quizAttempt.findMany({
          where: { userId, passed: true, quiz: { courseId: { in: teachingIds } } },
          select: { quizId: true },
        })
      : Promise.resolve([]),
  ]);
  const completedCourseIds = new Set(
    courseEnrollments.filter((row) => row.completedAt).map((row) => row.courseId)
  );
  const passedQuizIds = new Set(courseQuizPasses.map((row) => row.quizId));

  const specializeMissions = categories.flatMap((category) =>
    category.missions.filter((mission) => isSpecializeMissionName(mission.name))
  );
  const doneMissionIds = new Set(missionsDone.map((row) => row.missionId));
  const chosenMissions = specializeMissions.filter((mission) => doneMissionIds.has(mission.id));
  const chosenTracks = chosenMissions.map((mission) => trackNameFromMission(mission.name));
  const unlockLevel = levels.find((level) => level.name === SPECIALTY_UNLOCK_LEVEL) ?? null;
  const currentSort = profile?.currentLevel?.sortOrder ?? -1;
  const specialtyUnlocked = !!unlockLevel && currentSort >= unlockLevel.sortOrder;

  return {
    profile,
    levels,
    categories,
    skills,
    badges,
    teachingCourses: teachingCourses.map((course) => ({
      ...course,
      done: completedCourseIds.has(course.id) || (!!course.quiz && passedQuizIds.has(course.quiz.id)),
    })),
    totalXp: xpRows.reduce((sum, row) => sum + row.amount, 0),
    xpByCategory: Object.fromEntries(xpRows.map((row) => [row.categoryId, row.amount])),
    missionCompletions: missionsDone,
    moduleCompletions: modulesDone,
    certsHeld,
    skillsHeld,
    badgesHeld,
    specialty: {
      unlocked: specialtyUnlocked,
      unlocksAt: unlockLevel?.name ?? null,
      chosenTrack: chosenTracks[0] ?? null,
      chosenTracks,
      options: specializeMissions.map((mission) => ({
        missionId: mission.id,
        track: trackNameFromMission(mission.name),
        chosen: doneMissionIds.has(mission.id),
      })),
    },
  };
}

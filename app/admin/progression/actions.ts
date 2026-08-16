"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import { progressionNameSchema } from "@/lib/validations/progression";
import { evaluateProgression, grantProgressionBadges } from "@/lib/progression/engine";

async function requireProgressionAdmin() {
  if (!hubHas("progression")) throw new Error("Progression is not enabled");
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) throw new Error("Not authorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function revalidateProgression() {
  revalidatePath("/admin/progression");
  revalidatePath("/progress");
}

function parseNamed(formData: FormData) {
  const parsed = progressionNameSchema.safeParse({
    name: String(formData.get("name") ?? formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid form");
  return parsed.data;
}

function intField(formData: FormData, key: string, fallback = 0) {
  const n = Number(formData.get(key));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export async function createCategory(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const last = await prisma.progressionCategory.aggregate({ _max: { sortOrder: true } });
  await prisma.progressionCategory.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function updateCategory(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  await prisma.progressionCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
    },
  });
  revalidateProgression();
}

export async function createLevel(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const last = await prisma.progressionLevel.aggregate({ _max: { sortOrder: true } });
  await prisma.progressionLevel.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      xpRequired: intField(formData, "xpRequired"),
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function updateLevel(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  await prisma.progressionLevel.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      xpRequired: intField(formData, "xpRequired"),
    },
  });
  revalidateProgression();
}

export async function setLevelMilestone(levelId: string, missionId: string, on: boolean) {
  await requireProgressionAdmin();
  if (on) {
    await prisma.progressionLevelMilestone.upsert({
      where: { levelId_missionId: { levelId, missionId } },
      create: { levelId, missionId },
      update: {},
    });
  } else {
    await prisma.progressionLevelMilestone.deleteMany({ where: { levelId, missionId } });
  }
  revalidateProgression();
}

export async function setLevelCertReq(levelId: string, certificationId: string, on: boolean) {
  await requireProgressionAdmin();
  if (on) {
    await prisma.progressionLevelCertReq.upsert({
      where: { levelId_certificationId: { levelId, certificationId } },
      create: { levelId, certificationId },
      update: {},
    });
  } else {
    await prisma.progressionLevelCertReq.deleteMany({ where: { levelId, certificationId } });
  }
  revalidateProgression();
}

export async function createMission(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) throw new Error("Choose a category");
  const last = await prisma.progressionMission.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  const recurrence = String(formData.get("recurrence") || "ONE_TIME");
  await prisma.progressionMission.create({
    data: {
      categoryId,
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      xpValue: intField(formData, "xpValue"),
      recurrence:
        recurrence === "REPEATABLE" || recurrence === "DAILY" || recurrence === "WEEKLY"
          ? recurrence
          : "ONE_TIME",
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function updateMission(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  const recurrence = String(formData.get("recurrence") || "ONE_TIME");
  await prisma.progressionMission.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      categoryId: String(formData.get("categoryId") || ""),
      xpValue: intField(formData, "xpValue"),
      recurrence:
        recurrence === "REPEATABLE" || recurrence === "DAILY" || recurrence === "WEEKLY"
          ? recurrence
          : "ONE_TIME",
    },
  });
  revalidateProgression();
}

export async function createLearningModule(formData: FormData) {
  await requireProgressionAdmin();
  const title = String(formData.get("title") || formData.get("name") || "").trim();
  if (title.length < 2) throw new Error("Title is required");
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) throw new Error("Choose a category");
  const last = await prisma.progressionLearningModule.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  await prisma.progressionLearningModule.create({
    data: {
      categoryId,
      title,
      description: String(formData.get("description") || "") || null,
      content: String(formData.get("content") || "") || null,
      videoUrl: String(formData.get("videoUrl") || "") || null,
      linkUrl: String(formData.get("linkUrl") || "") || null,
      imageUrl: String(formData.get("imageUrl") || "") || null,
      status: (formData.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED") || "DRAFT",
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function updateLearningModule(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  await prisma.progressionLearningModule.update({
    where: { id },
    data: {
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "") || null,
      content: String(formData.get("content") || "") || null,
      videoUrl: String(formData.get("videoUrl") || "") || null,
      linkUrl: String(formData.get("linkUrl") || "") || null,
      imageUrl: String(formData.get("imageUrl") || "") || null,
      categoryId: String(formData.get("categoryId") || ""),
      status: (formData.get("status") as "DRAFT" | "ACTIVE" | "ARCHIVED") || "DRAFT",
    },
  });
  revalidateProgression();
}

export async function saveQuiz(formData: FormData) {
  await requireProgressionAdmin();
  const moduleId = String(formData.get("moduleId") || "");
  const passThreshold = intField(formData, "passThreshold", 70);
  const quiz = await prisma.progressionQuiz.upsert({
    where: { moduleId },
    create: { moduleId, passThreshold },
    update: { passThreshold },
  });
  await prisma.progressionQuizQuestion.deleteMany({ where: { quizId: quiz.id } });
  const count = intField(formData, "questionCount");
  for (let i = 0; i < count; i += 1) {
    const prompt = String(formData.get(`q${i}_prompt`) || "").trim();
    if (!prompt) continue;
    const options = [0, 1, 2, 3]
      .map((n) => String(formData.get(`q${i}_opt${n}`) || "").trim())
      .filter(Boolean);
    if (options.length < 2) continue;
    await prisma.progressionQuizQuestion.create({
      data: {
        quizId: quiz.id,
        prompt,
        options,
        correctIndex: intField(formData, `q${i}_correct`),
        sortOrder: i,
      },
    });
  }
  revalidateProgression();
}

export async function createCertification(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) throw new Error("Choose a category");
  const last = await prisma.progressionCertification.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  await prisma.progressionCertification.create({
    data: {
      categoryId,
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      tiers: {
        create: [
          { name: "Trainee", sortOrder: 0, unlockKind: "CATEGORY_XP", xpRequired: 0 },
          { name: "Certified", sortOrder: 1, unlockKind: "QUIZ_PASSED" },
          { name: "Master", sortOrder: 2, unlockKind: "ADMIN_REVIEW" },
        ],
      },
    },
  });
  revalidateProgression();
}

export async function updateCertification(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  await prisma.progressionCertification.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      categoryId: String(formData.get("categoryId") || ""),
    },
  });
  revalidateProgression();
}

export async function updateCertTier(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const unlockKind = String(formData.get("unlockKind") || "CATEGORY_XP");
  await prisma.progressionCertTier.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "") || null,
      unlockKind:
        unlockKind === "QUIZ_PASSED" || unlockKind === "ADMIN_REVIEW" ? unlockKind : "CATEGORY_XP",
      xpRequired: formData.get("xpRequired") ? intField(formData, "xpRequired") : null,
    },
  });
  revalidateProgression();
}

export async function createSkill(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const unlockKind = String(formData.get("unlockKind") || "MANUAL");
  const last = await prisma.progressionSkill.aggregate({ _max: { sortOrder: true } });
  await prisma.progressionSkill.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      unlockKind:
        unlockKind === "LEVEL" || unlockKind === "CATEGORY_XP" || unlockKind === "CERTIFICATION"
          ? unlockKind
          : "MANUAL",
      levelId: String(formData.get("levelId") || "") || null,
      categoryId: String(formData.get("categoryId") || "") || null,
      certificationId: String(formData.get("certificationId") || "") || null,
      xpRequired: formData.get("xpRequired") ? intField(formData, "xpRequired") : null,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function updateSkill(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  const unlockKind = String(formData.get("unlockKind") || "MANUAL");
  await prisma.progressionSkill.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      unlockKind:
        unlockKind === "LEVEL" || unlockKind === "CATEGORY_XP" || unlockKind === "CERTIFICATION"
          ? unlockKind
          : "MANUAL",
      levelId: String(formData.get("levelId") || "") || null,
      categoryId: String(formData.get("categoryId") || "") || null,
      certificationId: String(formData.get("certificationId") || "") || null,
      xpRequired: formData.get("xpRequired") ? intField(formData, "xpRequired") : null,
    },
  });
  revalidateProgression();
}

export async function createProgressionBadge(formData: FormData) {
  await requireProgressionAdmin();
  const data = parseNamed(formData);
  const trigger = String(formData.get("trigger") || "STANDALONE");
  await prisma.progressionBadge.create({
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      trigger:
        trigger === "LEVEL" || trigger === "MISSION" || trigger === "CERTIFICATION" || trigger === "SKILL"
          ? trigger
          : "STANDALONE",
      triggerId: String(formData.get("triggerId") || "") || null,
    },
  });
  revalidateProgression();
}

export async function updateProgressionBadge(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const data = parseNamed(formData);
  const trigger = String(formData.get("trigger") || "STANDALONE");
  await prisma.progressionBadge.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      status: data.status ?? "DRAFT",
      trigger:
        trigger === "LEVEL" || trigger === "MISSION" || trigger === "CERTIFICATION" || trigger === "SKILL"
          ? trigger
          : "STANDALONE",
      triggerId: String(formData.get("triggerId") || "") || null,
    },
  });
  revalidateProgression();
}

export async function createCertTier(formData: FormData) {
  await requireProgressionAdmin();
  const certificationId = String(formData.get("certificationId") || "");
  if (!certificationId) throw new Error("Missing certification");
  const last = await prisma.progressionCertTier.aggregate({
    where: { certificationId },
    _max: { sortOrder: true },
  });
  const unlockKind = String(formData.get("unlockKind") || "CATEGORY_XP");
  await prisma.progressionCertTier.create({
    data: {
      certificationId,
      name: String(formData.get("name") || "New tier").trim() || "New tier",
      description: String(formData.get("description") || "") || null,
      unlockKind:
        unlockKind === "QUIZ_PASSED" || unlockKind === "ADMIN_REVIEW" ? unlockKind : "CATEGORY_XP",
      xpRequired: formData.get("xpRequired") ? intField(formData, "xpRequired") : null,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateProgression();
}

export async function deleteProgressionItem(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const kind = String(formData.get("kind") || "");
  if (!id) throw new Error("Missing id");
  switch (kind) {
    case "category":
      await prisma.progressionCategory.delete({ where: { id } });
      break;
    case "level":
      await prisma.progressionLevel.delete({ where: { id } });
      break;
    case "mission":
      await prisma.progressionMission.delete({ where: { id } });
      break;
    case "module":
      await prisma.progressionLearningModule.delete({ where: { id } });
      break;
    case "certification":
      await prisma.progressionCertification.delete({ where: { id } });
      break;
    case "certTier":
      await prisma.progressionCertTier.delete({ where: { id } });
      break;
    case "skill":
      await prisma.progressionSkill.delete({ where: { id } });
      break;
    case "badge":
      await prisma.progressionBadge.delete({ where: { id } });
      break;
    default:
      throw new Error("Unknown item");
  }
  revalidateProgression();
}

export async function reorderProgressionItem(formData: FormData) {
  await requireProgressionAdmin();
  const id = String(formData.get("id") || "");
  const kind = String(formData.get("kind") || "");
  const direction = String(formData.get("direction") || "up") === "down" ? 1 : -1;
  type Row = { id: string; sortOrder: number };
  let siblings: Row[] = [];
  if (kind === "category") {
    siblings = await prisma.progressionCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "level") {
    siblings = await prisma.progressionLevel.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "mission") {
    const current = await prisma.progressionMission.findUnique({ where: { id } });
    if (!current) return;
    siblings = await prisma.progressionMission.findMany({
      where: { categoryId: current.categoryId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "module") {
    const current = await prisma.progressionLearningModule.findUnique({ where: { id } });
    if (!current) return;
    siblings = await prisma.progressionLearningModule.findMany({
      where: { categoryId: current.categoryId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "certification") {
    const current = await prisma.progressionCertification.findUnique({ where: { id } });
    if (!current) return;
    siblings = await prisma.progressionCertification.findMany({
      where: { categoryId: current.categoryId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "certTier") {
    const current = await prisma.progressionCertTier.findUnique({ where: { id } });
    if (!current) return;
    siblings = await prisma.progressionCertTier.findMany({
      where: { certificationId: current.certificationId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else if (kind === "skill") {
    siblings = await prisma.progressionSkill.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });
  } else {
    throw new Error("Cannot reorder this item");
  }

  const index = siblings.findIndex((row) => row.id === id);
  const swap = siblings[index + direction];
  if (index < 0 || !swap) return;
  const a = siblings[index];
  if (kind === "category") {
    await prisma.$transaction([
      prisma.progressionCategory.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionCategory.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "level") {
    await prisma.$transaction([
      prisma.progressionLevel.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionLevel.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "mission") {
    await prisma.$transaction([
      prisma.progressionMission.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionMission.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "module") {
    await prisma.$transaction([
      prisma.progressionLearningModule.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionLearningModule.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "certification") {
    await prisma.$transaction([
      prisma.progressionCertification.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionCertification.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "certTier") {
    await prisma.$transaction([
      prisma.progressionCertTier.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionCertTier.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  } else if (kind === "skill") {
    await prisma.$transaction([
      prisma.progressionSkill.update({ where: { id: a.id }, data: { sortOrder: swap.sortOrder } }),
      prisma.progressionSkill.update({ where: { id: swap.id }, data: { sortOrder: a.sortOrder } }),
    ]);
  }
  revalidateProgression();
}

export async function grantCertification(userId: string, certificationId: string, tierId: string) {
  const session = await requireProgressionAdmin();
  await prisma.progressionCertificationHeld.upsert({
    where: { userId_certificationId: { userId, certificationId } },
    create: { userId, certificationId, tierId, reviewedById: session.user.id },
    update: { tierId, reviewedById: session.user.id },
  });
  await grantProgressionBadges(userId, "CERTIFICATION", certificationId);
  await evaluateProgression(userId);
  revalidatePath(`/admin/progression/people/${userId}`);
  revalidatePath("/progress");
}

export async function grantSkill(userId: string, skillId: string) {
  await requireProgressionAdmin();
  await prisma.progressionSkillUnlock.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId },
    update: {},
  });
  await grantProgressionBadges(userId, "SKILL", skillId);
  await evaluateProgression(userId);
  revalidatePath(`/admin/progression/people/${userId}`);
}

export async function grantBadge(userId: string, badgeId: string) {
  await requireProgressionAdmin();
  await prisma.progressionBadgeGrant.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: { userId, badgeId },
    update: {},
  });
  revalidatePath(`/admin/progression/people/${userId}`);
}

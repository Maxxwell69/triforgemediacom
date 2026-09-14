import "server-only";

import { revalidatePath } from "next/cache";
import type {
  OnboardingActionType,
  OnboardingStep,
  OnboardingTrackScope,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserNetworkTrack, type NetworkTrack } from "@/lib/mnCn";
import { isAdminRole } from "@/lib/rbac";
import { onboardingEnabled } from "@/lib/onboarding/access";
import { getOnboardingProgram, listFirstLoginPrograms } from "@/lib/onboarding/config";
import {
  MEMBER_MENU_IDS,
  ONBOARDING_ALWAYS_MENU_IDS,
} from "@/lib/onboarding/menu";
import { awardXpOnce } from "@/lib/xp";

export function visibleOnboardingSteps<
  T extends { trackScope: OnboardingTrackScope },
>(steps: T[], track: NetworkTrack | null) {
  return steps.filter((step) => step.trackScope === "ALL" || (track && step.trackScope === track));
}

export function stepHref(step: {
  actionType: OnboardingActionType;
  actionTarget: string | null;
}) {
  const target = (step.actionTarget || "").trim();
  if (!target) return null;
  if (step.actionType === "COURSE_LINK") return `/learn/${target}`;
  if (step.actionType === "LINK" || step.actionType === "CUSTOM") return target;
  return null;
}

async function requiredCoursesCompleted(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return true;
  const done = await prisma.enrollment.count({
    where: { userId, courseId: { in: courseIds }, completedAt: { not: null } },
  });
  return done >= courseIds.length;
}

async function completedCourseIds(
  userId: string,
  courseIds: string[],
  since?: Date | null
) {
  if (courseIds.length === 0) return new Set<string>();
  const rows = await prisma.enrollment.findMany({
    where: {
      userId,
      courseId: { in: courseIds },
      completedAt: since
        ? { gte: since }
        : { not: null },
    },
    select: { courseId: true },
  });
  return new Set(rows.map((row) => row.courseId));
}

export async function syncCourseLinkedSteps(
  userId: string,
  steps: OnboardingStep[],
  completedStepIds: string[],
  /** After admin Assign/Reset, ignore course completions from before this time. */
  since?: Date | null
) {
  const courseSteps = steps.filter(
    (step) => step.actionType === "COURSE_LINK" && step.actionTarget
  );
  if (courseSteps.length === 0) return completedStepIds;
  const doneCourses = await completedCourseIds(
    userId,
    courseSteps.map((step) => step.actionTarget as string),
    since
  );
  const next = new Set(completedStepIds);
  for (const step of courseSteps) {
    if (step.actionTarget && doneCourses.has(step.actionTarget)) next.add(step.id);
  }
  return Array.from(next);
}

async function awardStepXp(
  userId: string,
  step: { id: string; title: string; xpReward: number }
) {
  if (step.xpReward <= 0) return;
  await awardXpOnce(prisma, {
    userId,
    amount: step.xpReward,
    source: "ONBOARDING_STEP",
    refId: step.id,
    note: step.title,
  });
}

async function tryCompleteProgress(
  userId: string,
  moduleId: string,
  completedStepIds: string[],
  requiredCourseIds: string[],
  visibleStepIds: string[],
  completionXpReward: number
) {
  if (visibleStepIds.length === 0) return false;
  const allStepsDone = visibleStepIds.every((id) => completedStepIds.includes(id));
  const coursesDone = await requiredCoursesCompleted(userId, requiredCourseIds);
  if (!allStepsDone || !coursesDone) return false;
  const progress = await prisma.userOnboardingProgress.update({
    where: { userId_moduleId: { userId, moduleId } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  if (completionXpReward > 0) {
    await awardXpOnce(prisma, {
      userId,
      amount: completionXpReward,
      source: "ONBOARDING_COMPLETE",
      refId: progress.id,
      note: "Onboarding checklist complete",
    });
  }
  return true;
}

/** New-member trigger: assign every enabled first-login program if no row exists. */
export async function ensureOnboardingProgress(userId: string) {
  if (!onboardingEnabled()) return null;
  try {
    const programs = await listFirstLoginPrograms();
    const created = [];
    for (const program of programs) {
      created.push(
        await prisma.userOnboardingProgress.upsert({
          where: { userId_moduleId: { userId, moduleId: program.id } },
          update: {},
          create: { userId, moduleId: program.id, status: "IN_PROGRESS" },
        })
      );
    }
    return created;
  } catch (err) {
    console.error("ensureOnboardingProgress skipped:", err);
    return null;
  }
}

export async function assignOnboardingProgress(
  userId: string,
  adminId: string,
  moduleId: string
) {
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  const program = await getOnboardingProgram(moduleId);
  if (!program) throw new Error("Checklist not found");
  if (!program.enabled) throw new Error("That checklist is turned off");
  return prisma.userOnboardingProgress.upsert({
    where: { userId_moduleId: { userId, moduleId: program.id } },
    create: {
      userId,
      moduleId: program.id,
      status: "IN_PROGRESS",
      assignedById: adminId,
      assignedAt: new Date(),
      completedStepIds: [],
      dismissedAt: null,
      dismissedDisclaimerAccepted: false,
      completedAt: null,
    },
    update: {
      status: "IN_PROGRESS",
      assignedById: adminId,
      assignedAt: new Date(),
      completedStepIds: [],
      dismissedAt: null,
      dismissedDisclaimerAccepted: false,
      completedAt: null,
    },
  });
}

export type MemberOnboardingCard = {
  config: NonNullable<Awaited<ReturnType<typeof getOnboardingProgram>>>;
  progress: NonNullable<
    Awaited<ReturnType<typeof prisma.userOnboardingProgress.findUnique>>
  >;
  track: NetworkTrack | null;
  steps: OnboardingStep[];
  completedStepIds: string[];
};

export async function loadMemberOnboardings(userId: string): Promise<MemberOnboardingCard[]> {
  if (!onboardingEnabled()) return [];
  const [progressRows, track] = await Promise.all([
    prisma.userOnboardingProgress.findMany({ where: { userId } }),
    getUserNetworkTrack(userId),
  ]);
  if (progressRows.length === 0) return [];

  const programs = await prisma.onboardingModule.findMany({
    where: { id: { in: progressRows.map((row) => row.moduleId) }, enabled: true },
    include: { steps: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    orderBy: [{ assignOnFirstLogin: "desc" }, { createdAt: "asc" }],
  });

  const cards: MemberOnboardingCard[] = [];
  for (const program of programs) {
    const progress = progressRows.find((row) => row.moduleId === program.id);
    if (!progress) continue;
    const visible = visibleOnboardingSteps(program.steps, track);
    const synced = await syncCourseLinkedSteps(
      userId,
      visible,
      progress.completedStepIds,
      progress.assignedAt
    );
    if (
      synced.length !== progress.completedStepIds.length ||
      synced.some((id) => !progress.completedStepIds.includes(id))
    ) {
      const newlyDone = synced.filter((id) => !progress.completedStepIds.includes(id));
      await prisma.userOnboardingProgress.update({
        where: { id: progress.id },
        data: { completedStepIds: synced },
      });
      progress.completedStepIds = synced;
      if (progress.status === "IN_PROGRESS") {
        for (const step of visible.filter((s) => newlyDone.includes(s.id))) {
          await awardStepXp(userId, step);
        }
      }
    }
    if (progress.status === "IN_PROGRESS") {
      const completed = await tryCompleteProgress(
        userId,
        program.id,
        synced,
        program.requiredCourseIds,
        visible.map((s) => s.id),
        program.completionXpReward
      );
      if (completed) progress.status = "COMPLETED";
    }
    cards.push({
      config: program,
      progress,
      track,
      steps: visible,
      completedStepIds: synced,
    });
  }
  return cards;
}

async function loadOne(userId: string, moduleId: string) {
  const cards = await loadMemberOnboardings(userId);
  const card = cards.find((item) => item.config.id === moduleId);
  if (!card) throw new Error("Onboarding is not active");
  return card;
}

export async function toggleOnboardingStep(userId: string, stepId: string, done: boolean) {
  const stepRow = await prisma.onboardingStep.findUnique({
    where: { id: stepId },
    select: { moduleId: true },
  });
  if (!stepRow) throw new Error("Step not found");
  const loaded = await loadOne(userId, stepRow.moduleId);
  if (loaded.progress.status !== "IN_PROGRESS") {
    throw new Error("Onboarding is not active");
  }
  const step = loaded.steps.find((s) => s.id === stepId);
  if (!step) throw new Error("Step not found");

  const next = new Set(loaded.completedStepIds);
  if (done) next.add(stepId);
  else next.delete(stepId);
  const completedStepIds = Array.from(next);

  await prisma.userOnboardingProgress.update({
    where: { id: loaded.progress.id },
    data: { completedStepIds, status: "IN_PROGRESS", completedAt: null },
  });
  if (done) {
    await awardStepXp(userId, step);
  }
  await tryCompleteProgress(
    userId,
    loaded.config.id,
    completedStepIds,
    loaded.config.requiredCourseIds,
    loaded.steps.map((s) => s.id),
    loaded.config.completionXpReward
  );
}

export async function dismissOnboarding(userId: string, moduleId: string) {
  const loaded = await loadOne(userId, moduleId);
  if (loaded.progress.status !== "IN_PROGRESS") {
    throw new Error("Onboarding is not active");
  }
  await prisma.$transaction([
    prisma.userOnboardingProgress.update({
      where: { id: loaded.progress.id },
      data: {
        status: "DISMISSED",
        dismissedAt: new Date(),
        dismissedDisclaimerAccepted: true,
      },
    }),
    prisma.onboardingDismissalLog.create({
      data: { userId, moduleId: loaded.config.id, action: "DISMISSED" },
    }),
  ]);
}

export async function reopenOnboarding(userId: string, moduleId: string) {
  const loaded = await loadOne(userId, moduleId);
  if (loaded.progress.status !== "DISMISSED") {
    throw new Error("Onboarding is not dismissed");
  }
  await prisma.$transaction([
    prisma.userOnboardingProgress.update({
      where: { id: loaded.progress.id },
      data: {
        status: "IN_PROGRESS",
        dismissedAt: null,
        dismissedDisclaimerAccepted: false,
        completedAt: null,
      },
    }),
    prisma.onboardingDismissalLog.create({
      data: { userId, moduleId: loaded.config.id, action: "REOPENED" },
    }),
  ]);
}

async function isCourseFullyComplete(userId: string, courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true },
  });
  if (lessons.length === 0) return false;
  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: lessons.map((lesson) => lesson.id) },
      completedAt: { not: null },
    },
  });
  if (completedCount < lessons.length) return false;
  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    select: { id: true },
  });
  if (quiz) {
    const passed = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id, passed: true },
      select: { id: true },
    });
    if (!passed) return false;
  }
  return true;
}

/** Check off in-progress COURSE_LINK steps when the member actually finishes that course. */
export async function applyCourseCompletionToOnboarding(userId: string, courseId: string) {
  if (!onboardingEnabled() || !courseId) return;
  try {
    if (!(await isCourseFullyComplete(userId, courseId))) return;
    const [rows, track] = await Promise.all([
      prisma.userOnboardingProgress.findMany({
        where: { userId, status: "IN_PROGRESS", module: { enabled: true } },
        include: {
          module: { include: { steps: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } } },
        },
      }),
      getUserNetworkTrack(userId),
    ]);
    let changed = false;
    for (const progress of rows) {
      const visible = visibleOnboardingSteps(progress.module.steps, track);
      const matching = visible.filter(
        (step) => step.actionType === "COURSE_LINK" && step.actionTarget === courseId
      );
      if (matching.length === 0) continue;
      const next = new Set(progress.completedStepIds);
      const newlyDone = matching.filter((step) => !next.has(step.id));
      for (const step of newlyDone) next.add(step.id);
      const completedStepIds = Array.from(next);
      if (newlyDone.length > 0) {
        await prisma.userOnboardingProgress.update({
          where: { id: progress.id },
          data: { completedStepIds },
        });
        for (const step of newlyDone) {
          await awardStepXp(userId, step);
        }
        changed = true;
      }
      const completed = await tryCompleteProgress(
        userId,
        progress.moduleId,
        completedStepIds,
        progress.module.requiredCourseIds,
        visible.map((step) => step.id),
        progress.module.completionXpReward
      );
      if (completed) changed = true;
    }
    if (changed) {
      revalidatePath("/home");
      revalidatePath("/account");
    }
  } catch (err) {
    console.error("applyCourseCompletionToOnboarding skipped:", err);
  }
}

export async function requiredCourseProgress(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return { done: 0, total: 0 };
  const done = await prisma.enrollment.count({
    where: { userId, courseId: { in: courseIds }, completedAt: { not: null } },
  });
  return { done, total: courseIds.length };
}

export async function loadRequiredCourseLinks(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return [];
  const [courses, doneIds] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    completedCourseIds(userId, courseIds),
  ]);
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    href: `/learn/${course.id}`,
    done: doneIds.has(course.id),
  }));
}

export function summarizeOnboardingStatus(
  rows: { status: "NOT_STARTED" | "IN_PROGRESS" | "DISMISSED" | "COMPLETED" }[]
) {
  if (rows.some((row) => row.status === "IN_PROGRESS")) return "IN_PROGRESS" as const;
  if (rows.some((row) => row.status === "DISMISSED")) return "DISMISSED" as const;
  if (rows.some((row) => row.status === "COMPLETED")) return "COMPLETED" as const;
  return "NOT_STARTED" as const;
}

/**
 * When a member has an in-progress checklist with allowedMenuIds set,
 * they only see those member-menu items until they finish or dismiss.
 * Staff (admin/mod) are never locked. Empty allowedMenuIds = no extra restriction.
 */
export async function getOnboardingMenuLock(
  userId: string,
  role: UserRole | undefined | null
): Promise<Set<string> | null> {
  if (!onboardingEnabled() || isAdminRole(role)) return null;
  try {
    const rows = await prisma.userOnboardingProgress.findMany({
      where: {
        userId,
        status: "IN_PROGRESS",
        module: { enabled: true },
      },
      select: { module: { select: { allowedMenuIds: true } } },
    });
    const restricting = rows.filter((row) => row.module.allowedMenuIds.length > 0);
    if (restricting.length === 0) return null;

    const allowed = new Set<string>(ONBOARDING_ALWAYS_MENU_IDS);
    for (const row of restricting) {
      for (const id of row.module.allowedMenuIds) {
        if (MEMBER_MENU_IDS.has(id)) allowed.add(id);
      }
    }
    return allowed;
  } catch (err) {
    console.error("getOnboardingMenuLock skipped:", err);
    return null;
  }
}

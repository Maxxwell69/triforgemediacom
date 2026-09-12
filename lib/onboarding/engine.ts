import "server-only";

import type {
  OnboardingActionType,
  OnboardingStep,
  OnboardingTrackScope,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserNetworkTrack, type NetworkTrack } from "@/lib/mnCn";
import { onboardingEnabled } from "@/lib/onboarding/access";
import { getOrCreateOnboardingModule, ONBOARDING_MODULE_ID } from "@/lib/onboarding/config";

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

async function completedCourseIds(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return new Set<string>();
  const rows = await prisma.enrollment.findMany({
    where: { userId, courseId: { in: courseIds }, completedAt: { not: null } },
    select: { courseId: true },
  });
  return new Set(rows.map((row) => row.courseId));
}

export async function syncCourseLinkedSteps(
  userId: string,
  steps: OnboardingStep[],
  completedStepIds: string[]
) {
  const courseSteps = steps.filter(
    (step) => step.actionType === "COURSE_LINK" && step.actionTarget
  );
  if (courseSteps.length === 0) return completedStepIds;
  const doneCourses = await completedCourseIds(
    userId,
    courseSteps.map((step) => step.actionTarget as string)
  );
  const next = new Set(completedStepIds);
  for (const step of courseSteps) {
    if (step.actionTarget && doneCourses.has(step.actionTarget)) next.add(step.id);
  }
  return Array.from(next);
}

async function tryCompleteProgress(
  userId: string,
  completedStepIds: string[],
  requiredCourseIds: string[],
  visibleStepIds: string[]
) {
  const allStepsDone = visibleStepIds.every((id) => completedStepIds.includes(id));
  const coursesDone = await requiredCoursesCompleted(userId, requiredCourseIds);
  if (!allStepsDone || !coursesDone) return false;
  await prisma.userOnboardingProgress.update({
    where: { userId_moduleId: { userId, moduleId: ONBOARDING_MODULE_ID } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  return true;
}

/** New-member trigger: create IN_PROGRESS if the module is on and no row exists. */
export async function ensureOnboardingProgress(userId: string) {
  if (!onboardingEnabled()) return null;
  try {
    const onboardingModule = await getOrCreateOnboardingModule();
    if (!onboardingModule.enabled) return null;
    return prisma.userOnboardingProgress.upsert({
      where: { userId_moduleId: { userId, moduleId: onboardingModule.id } },
      update: {},
      create: { userId, moduleId: onboardingModule.id, status: "IN_PROGRESS" },
    });
  } catch (err) {
    console.error("ensureOnboardingProgress skipped:", err);
    return null;
  }
}

export async function assignOnboardingProgress(userId: string, adminId: string) {
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  const onboardingModule = await getOrCreateOnboardingModule();
  if (!onboardingModule.enabled) throw new Error("Onboarding is turned off for this hub");
  return prisma.userOnboardingProgress.upsert({
    where: { userId_moduleId: { userId, moduleId: onboardingModule.id } },
    create: {
      userId,
      moduleId: onboardingModule.id,
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

export async function loadMemberOnboarding(userId: string) {
  if (!onboardingEnabled()) return null;
  const onboardingModule = await getOrCreateOnboardingModule();
  if (!onboardingModule.enabled) return null;
  const [progress, track] = await Promise.all([
    prisma.userOnboardingProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId: onboardingModule.id } },
    }),
    getUserNetworkTrack(userId),
  ]);
  if (!progress) {
    return {
      config: onboardingModule,
      progress: null,
      track,
      steps: [],
      completedStepIds: [] as string[],
    };
  }

  const visible = visibleOnboardingSteps(onboardingModule.steps, track);
  const synced = await syncCourseLinkedSteps(userId, visible, progress.completedStepIds);
  if (synced.length !== progress.completedStepIds.length || synced.some((id) => !progress.completedStepIds.includes(id))) {
    await prisma.userOnboardingProgress.update({
      where: { id: progress.id },
      data: { completedStepIds: synced },
    });
    progress.completedStepIds = synced;
  }
  if (progress.status === "IN_PROGRESS") {
    const completed = await tryCompleteProgress(
      userId,
      synced,
      onboardingModule.requiredCourseIds,
      visible.map((s) => s.id)
    );
    if (completed) progress.status = "COMPLETED";
  }

  return { config: onboardingModule, progress, track, steps: visible, completedStepIds: synced };
}

export async function toggleOnboardingStep(userId: string, stepId: string, done: boolean) {
  const loaded = await loadMemberOnboarding(userId);
  if (!loaded?.progress || loaded.progress.status !== "IN_PROGRESS") {
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
  await tryCompleteProgress(
    userId,
    completedStepIds,
    loaded.config.requiredCourseIds,
    loaded.steps.map((s) => s.id)
  );
}

export async function dismissOnboarding(userId: string) {
  const loaded = await loadMemberOnboarding(userId);
  if (!loaded?.progress || loaded.progress.status !== "IN_PROGRESS") {
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

export async function reopenOnboarding(userId: string) {
  const loaded = await loadMemberOnboarding(userId);
  if (!loaded?.progress || loaded.progress.status !== "DISMISSED") {
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

export async function requiredCourseProgress(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return { done: 0, total: 0 };
  const done = await prisma.enrollment.count({
    where: { userId, courseId: { in: courseIds }, completedAt: { not: null } },
  });
  return { done, total: courseIds.length };
}

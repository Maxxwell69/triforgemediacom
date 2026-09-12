import "server-only";

import { prisma } from "@/lib/prisma";

export const DEFAULT_ONBOARDING_DISCLAIMER =
  "Dismissing this means you may miss required steps, including course requirements. Admins can see that you dismissed this.";

const programInclude = {
  steps: { orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }] },
};

export async function ensureGettingStartedProgram() {
  const existing = await prisma.onboardingModule.findFirst({
    orderBy: { createdAt: "asc" },
    include: programInclude,
  });
  if (existing) return existing;
  return prisma.onboardingModule.create({
    data: {
      title: "Getting Started",
      kind: "GETTING_STARTED",
      assignOnFirstLogin: true,
      enabled: true,
      dismissalDisclaimerText: DEFAULT_ONBOARDING_DISCLAIMER,
      requiredCourseIds: [],
    },
    include: programInclude,
  });
}

export async function listOnboardingPrograms() {
  await ensureGettingStartedProgram();
  return prisma.onboardingModule.findMany({
    orderBy: [{ assignOnFirstLogin: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { steps: true, progress: true } },
    },
  });
}

export async function getOnboardingProgram(id: string) {
  return prisma.onboardingModule.findUnique({
    where: { id },
    include: programInclude,
  });
}

export async function listFirstLoginPrograms() {
  await ensureGettingStartedProgram();
  return prisma.onboardingModule.findMany({
    where: { enabled: true, assignOnFirstLogin: true },
    orderBy: { createdAt: "asc" },
  });
}

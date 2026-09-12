import "server-only";

import { prisma } from "@/lib/prisma";

export const ONBOARDING_MODULE_ID = "default";

export const DEFAULT_ONBOARDING_DISCLAIMER =
  "Dismissing this means you may miss required steps, including course requirements. Admins can see that you dismissed this.";

export async function getOrCreateOnboardingModule() {
  return prisma.onboardingModule.upsert({
    where: { id: ONBOARDING_MODULE_ID },
    create: {
      id: ONBOARDING_MODULE_ID,
      enabled: true,
      dismissalDisclaimerText: DEFAULT_ONBOARDING_DISCLAIMER,
      requiredCourseIds: [],
    },
    update: {},
    include: {
      steps: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
    },
  });
}

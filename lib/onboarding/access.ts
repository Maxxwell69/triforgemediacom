import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";

export const ONBOARDING_SETTINGS_ID = "default";

/** SKU is on — admin can edit checklists. */
export function onboardingEnabled() {
  return hubHas("onboardingChecklist");
}

export function requireOnboardingModule() {
  if (!onboardingEnabled()) notFound();
}

/** Members see Home cards, first-login assign, and menu lock only when this is true. */
export async function onboardingLive() {
  if (!onboardingEnabled()) return false;
  try {
    const row = await prisma.onboardingSettings.findUnique({
      where: { id: ONBOARDING_SETTINGS_ID },
      select: { active: true },
    });
    return row?.active === true;
  } catch (err) {
    console.error("onboardingLive skipped:", err);
    return false;
  }
}

export async function getOnboardingSettings() {
  return prisma.onboardingSettings.upsert({
    where: { id: ONBOARDING_SETTINGS_ID },
    create: { id: ONBOARDING_SETTINGS_ID, active: false },
    update: {},
  });
}

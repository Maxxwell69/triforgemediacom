import "server-only";

import { prisma } from "@/lib/prisma";

export const PROGRESSION_SETTINGS_ID = "default";

export const DEFAULT_EXPLAINER_HEADLINE = "Creator Progression";

export const DEFAULT_EXPLAINER_BODY =
  "Climb the official TriForge ladder from Recruit through Legend. Complete missions, earn certs, and unlock a specialty at Rising Star. Creator Network members start as Recruits. Media Network members apply below — the team reviews each request.";

export async function getOrCreateProgressionSettings() {
  return prisma.progressionSettings.upsert({
    where: { id: PROGRESSION_SETTINGS_ID },
    create: {
      id: PROGRESSION_SETTINGS_ID,
      explainerHeadline: DEFAULT_EXPLAINER_HEADLINE,
      explainerBody: DEFAULT_EXPLAINER_BODY,
    },
    update: {},
  });
}

export async function isProgressionVisibleToMembers() {
  const settings = await getOrCreateProgressionSettings();
  return settings.memberVisible;
}

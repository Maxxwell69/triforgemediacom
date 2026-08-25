import "server-only";

import { prisma } from "@/lib/prisma";

export const PROGRESSION_SETTINGS_ID = "default";

/** Set true to hide Progress from CN/MN again (staff-only). Live for all members. */
export const PROGRESSION_MEMBERS_LOCKED = false;

export const DEFAULT_EXPLAINER_HEADLINE = "Creator Progression";

export const DEFAULT_EXPLAINER_VIDEO_URL = "https://youtu.be/QXh4TMdixP4";

export const DEFAULT_EXPLAINER_BODY =
  "Climb the official TriForge ladder from Recruit through Legend. Complete missions, earn certs, and unlock a specialty at Rising Star. Creator Network members start as Recruits. Media Network members apply below — the team reviews each request.";

export async function getOrCreateProgressionSettings() {
  const settings = await prisma.progressionSettings.upsert({
    where: { id: PROGRESSION_SETTINGS_ID },
    create: {
      id: PROGRESSION_SETTINGS_ID,
      explainerHeadline: DEFAULT_EXPLAINER_HEADLINE,
      explainerBody: DEFAULT_EXPLAINER_BODY,
      explainerVideoUrl: DEFAULT_EXPLAINER_VIDEO_URL,
    },
    update: {},
  });
  if (settings.explainerVideoUrl) return settings;
  return prisma.progressionSettings.update({
    where: { id: PROGRESSION_SETTINGS_ID },
    data: { explainerVideoUrl: DEFAULT_EXPLAINER_VIDEO_URL },
  });
}

export async function isProgressionVisibleToMembers() {
  if (PROGRESSION_MEMBERS_LOCKED) return false;
  // Live for every hub member. MN still land on the apply sheet until approved.
  return true;
}

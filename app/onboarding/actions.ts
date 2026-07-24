"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { onboardingSchema } from "@/lib/validations/onboarding";

export async function completeOnboarding(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    platform: formData.get("platform"),
    goals: formData.getAll("goals"),
    bio: formData.get("bio"),
    tiktokUrl: formData.get("tiktokUrl"),
    twitchUrl: formData.get("twitchUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { platform, goals, bio, tiktokUrl, twitchUrl, youtubeUrl } = parsed.data;

  const goalsJson: Record<string, boolean> = {};
  for (const key of goals) goalsJson[key] = true;

  const socialLinks: Record<string, string> = {};
  if (tiktokUrl) socialLinks.tiktok = tiktokUrl;
  if (twitchUrl) socialLinks.twitch = twitchUrl;
  if (youtubeUrl) socialLinks.youtube = youtubeUrl;

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      platform,
      goals: goalsJson,
      bio: bio || null,
      socialLinks,
    },
    create: {
      userId: user.id,
      platform,
      goals: goalsJson,
      bio: bio || null,
      socialLinks,
    },
  });

  redirect("/channels");
}

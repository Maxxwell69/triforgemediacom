"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { onboardingSchema } from "@/lib/validations/onboarding";
import type { ProfileFormState } from "@/components/ProfileForm";
import { sendWelcomeEmail } from "@/lib/email";

export async function completeOnboarding(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    platform: formData.get("platform"),
    goals: formData.getAll("goals"),
    bio: formData.get("bio"),
    tiktokUrl: formData.get("tiktokUrl"),
    twitchUrl: formData.get("twitchUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    pinnedTiktokVideoUrl: formData.get("pinnedTiktokVideoUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { platform, goals, bio, tiktokUrl, twitchUrl, youtubeUrl, pinnedTiktokVideoUrl } =
    parsed.data;

  const goalsJson: Record<string, boolean> = {};
  for (const key of goals) goalsJson[key] = true;

  const socialLinks: Record<string, string> = {};
  if (tiktokUrl) socialLinks.tiktok = tiktokUrl;
  if (twitchUrl) socialLinks.twitch = twitchUrl;
  if (youtubeUrl) socialLinks.youtube = youtubeUrl;

  const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      platform,
      goals: goalsJson,
      bio: bio || null,
      socialLinks,
      pinnedTiktokVideoUrl: pinnedTiktokVideoUrl || null,
    },
    create: {
      userId: user.id,
      platform,
      goals: goalsJson,
      bio: bio || null,
      socialLinks,
      pinnedTiktokVideoUrl: pinnedTiktokVideoUrl || null,
    },
  });

  if (!existingProfile && user.email) {
    await sendWelcomeEmail(user.email, user.name || "there");
  }

  redirect("/home");
}

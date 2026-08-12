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
    phone: formData.get("phone"),
    country: formData.get("country"),
    tiktokUrl: formData.get("tiktokUrl"),
    twitchUrl: formData.get("twitchUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    pinnedTiktokVideoUrl: formData.get("pinnedTiktokVideoUrl"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const {
    platform,
    goals,
    bio,
    phone,
    country,
    tiktokUrl,
    twitchUrl,
    youtubeUrl,
    pinnedTiktokVideoUrl,
  } = parsed.data;

  const goalsJson: Record<string, boolean> = {};
  for (const key of goals) goalsJson[key] = true;

  const socialLinks: Record<string, string> = {};
  if (tiktokUrl) socialLinks.tiktok = tiktokUrl;
  if (twitchUrl) socialLinks.twitch = twitchUrl;
  if (youtubeUrl) socialLinks.youtube = youtubeUrl;

  // Seed hub username from TikTok @handle when missing so chat never falls
  // through to the generic "Member" label for new creators.
  let usernameFromTikTok: string | null = null;
  if (tiktokUrl) {
    const fromUrl = tiktokUrl.match(/tiktok\.com\/@([\w.-]+)/i);
    const bare = (fromUrl?.[1] || tiktokUrl.replace(/^@/, "").trim()).toLowerCase();
    if (/^[\w.-]{2,64}$/.test(bare)) usernameFromTikTok = bare;
  }

  const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });

  let usernameToSet: string | null = null;
  if (!existingProfile?.username && usernameFromTikTok) {
    const taken = await prisma.profile.findFirst({
      where: { username: usernameFromTikTok, NOT: { userId: user.id } },
      select: { userId: true },
    });
    if (!taken) usernameToSet = usernameFromTikTok;
  }

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      platform,
      goals: goalsJson,
      bio: bio || null,
      phone: phone || null,
      country: country || null,
      socialLinks,
      pinnedTiktokVideoUrl: pinnedTiktokVideoUrl || null,
      ...(usernameToSet ? { username: usernameToSet } : {}),
    },
    create: {
      userId: user.id,
      platform,
      goals: goalsJson,
      bio: bio || null,
      phone: phone || null,
      country: country || null,
      socialLinks,
      pinnedTiktokVideoUrl: pinnedTiktokVideoUrl || null,
      username: usernameToSet,
    },
  });

  if (!existingProfile && user.email) {
    await sendWelcomeEmail(user.email, user.name || "there");
  }

  redirect("/home");
}

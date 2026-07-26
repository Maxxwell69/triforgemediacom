"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { changePasswordSchema } from "@/lib/validations/account";
import { refreshTikTokStats } from "@/lib/tiktokOAuth";
import type { ProfileFormState } from "@/components/ProfileForm";

export async function updateProfile(
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

  revalidatePath("/account");
  return { success: true };
}

export type ChangePasswordState = { error?: string; success?: boolean } | null;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.passwordHash) {
    return { error: "No password is set for this account." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}

export async function disconnectTikTok() {
  const user = await requireUser();
  await prisma.tikTokConnection.deleteMany({ where: { userId: user.id } });
  revalidatePath("/account");
}

export async function refreshTikTokStatsAction() {
  const user = await requireUser();
  try {
    await refreshTikTokStats(user.id);
  } catch (err) {
    console.error("Failed to refresh TikTok stats:", err);
  }
  revalidatePath("/account");
}

import { prisma } from "@/lib/prisma";
import {
  checkLive,
  fetchUserProfile,
  isTikToolsConfigured,
  parseTikTokUniqueId,
} from "@/lib/tiktools";

const STATS_MIN_INTERVAL_MS = 30_000;

export type RefreshTikTokStatsResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Refresh cached TikTok profile stats + live status for a user from their
 * Profile.socialLinks.tiktok handle (tik.tools — no OAuth).
 */
export async function refreshTikTokStatsSnapshot(
  userId: string,
  opts?: { force?: boolean }
): Promise<RefreshTikTokStatsResult> {
  if (!isTikToolsConfigured()) {
    return { ok: false, error: "TikTok stats are not configured (missing API key)." };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { socialLinks: true },
  });
  const socialLinks = (profile?.socialLinks as Record<string, string> | null) ?? {};
  const uniqueId = parseTikTokUniqueId(socialLinks.tiktok);
  if (!uniqueId) {
    return {
      ok: false,
      error: "Add your TikTok profile URL on this page first, then refresh stats.",
    };
  }

  const existing = await prisma.tikTokStatsSnapshot.findUnique({ where: { userId } });
  if (
    !opts?.force &&
    existing?.statsFetchedAt &&
    Date.now() - existing.statsFetchedAt.getTime() < STATS_MIN_INTERVAL_MS
  ) {
    // Still refresh live status even when stats are fresh
    try {
      const live = await checkLive(uniqueId);
      await prisma.tikTokStatsSnapshot.update({
        where: { userId },
        data: {
          isLive: live.isLive,
          roomId: live.roomId,
          liveTitle: live.title,
          liveViewerCount: live.viewerCount,
          liveCheckedAt: new Date(),
        },
      });
      return { ok: true };
    } catch (err) {
      console.error("tik.tools live check failed:", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Live check failed",
      };
    }
  }

  const now = new Date();
  let profileError: string | null = null;
  let userProfile: Awaited<ReturnType<typeof fetchUserProfile>> | null = null;
  let live: Awaited<ReturnType<typeof checkLive>> | null = null;

  try {
    userProfile = await fetchUserProfile(uniqueId, { nocache: true });
  } catch (err) {
    console.error("tik.tools user_profile failed:", err);
    profileError = err instanceof Error ? err.message : "Profile lookup failed";
  }

  try {
    live = await checkLive(uniqueId);
  } catch (err) {
    console.error("tik.tools live check failed:", err);
    if (!userProfile) {
      return {
        ok: false,
        error: profileError || (err instanceof Error ? err.message : "Live check failed"),
      };
    }
  }

  await prisma.tikTokStatsSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      uniqueId: userProfile?.uniqueId ?? uniqueId,
      nickname: userProfile?.nickname ?? null,
      avatarUrl: userProfile?.avatarUrl ?? null,
      verified: userProfile?.verified ?? false,
      bio: userProfile?.signature ?? null,
      followerCount: userProfile?.followerCount ?? 0,
      followingCount: userProfile?.followingCount ?? 0,
      heartCount: userProfile?.heartCount ?? 0,
      videoCount: userProfile?.videoCount ?? 0,
      isLive: live?.isLive ?? false,
      roomId: live?.roomId ?? null,
      liveTitle: live?.title ?? null,
      liveViewerCount: live?.viewerCount ?? null,
      statsFetchedAt: userProfile ? now : null,
      liveCheckedAt: live ? now : null,
    },
    update: {
      ...(userProfile
        ? {
            uniqueId: userProfile.uniqueId,
            nickname: userProfile.nickname,
            avatarUrl: userProfile.avatarUrl,
            verified: userProfile.verified,
            bio: userProfile.signature,
            followerCount: userProfile.followerCount,
            followingCount: userProfile.followingCount,
            heartCount: userProfile.heartCount,
            videoCount: userProfile.videoCount,
            statsFetchedAt: now,
          }
        : { uniqueId }),
      ...(live
        ? {
            isLive: live.isLive,
            roomId: live.roomId,
            liveTitle: live.title,
            liveViewerCount: live.viewerCount,
            liveCheckedAt: now,
          }
        : {}),
    },
  });

  if (profileError && !live) {
    return { ok: false, error: profileError };
  }
  if (profileError) {
    return {
      ok: false,
      error: `Live status updated, but profile stats failed: ${profileError}`,
    };
  }
  return { ok: true };
}

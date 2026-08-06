import "server-only";
import { prisma } from "@/lib/prisma";
import { getUserPointsTotal } from "@/lib/points";
import { fetchRoomInfo, type TikToolsRoomInfo } from "@/lib/tiktools";

export type CreatorInsightsData = {
  uniqueId: string;
  nickname: string | null;
  avatarUrl: string | null;
  verified: boolean;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
  isLive: boolean;
  liveTitle: string | null;
  liveViewerCount: number | null;
  roomId: string | null;
  statsFetchedAt: Date | null;
  liveCheckedAt: Date | null;
  /** Likes per follower (0 if no followers). */
  likesPerFollower: number;
  /** Videos per 1k followers. */
  videosPer1kFollowers: number;
  hubPoints: number;
  streakCount: number;
  room: TikToolsRoomInfo | null;
};

function ratio(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return numerator / denominator;
}

/**
 * Load private creator insights for Account / Admin pages.
 * Enriches with room_info when the creator is currently live.
 */
export async function loadCreatorInsights(
  userId: string
): Promise<CreatorInsightsData | null> {
  const [snapshot, profile, points] = await Promise.all([
    prisma.tikTokStatsSnapshot.findUnique({ where: { userId } }),
    prisma.profile.findUnique({
      where: { userId },
      select: { streakCount: true },
    }),
    getUserPointsTotal(userId),
  ]);

  if (!snapshot) return null;

  let room: TikToolsRoomInfo | null = null;
  if (snapshot.isLive && snapshot.roomId) {
    room = await fetchRoomInfo(snapshot.roomId);
  }

  const followers = snapshot.followerCount;
  return {
    uniqueId: snapshot.uniqueId,
    nickname: snapshot.nickname,
    avatarUrl: snapshot.avatarUrl,
    verified: snapshot.verified,
    bio: snapshot.bio,
    followerCount: snapshot.followerCount,
    followingCount: snapshot.followingCount,
    heartCount: snapshot.heartCount,
    videoCount: snapshot.videoCount,
    isLive: snapshot.isLive,
    liveTitle: room?.title || snapshot.liveTitle,
    liveViewerCount:
      room?.userCount != null ? room.userCount : snapshot.liveViewerCount,
    roomId: snapshot.roomId,
    statsFetchedAt: snapshot.statsFetchedAt,
    liveCheckedAt: snapshot.liveCheckedAt,
    likesPerFollower: ratio(snapshot.heartCount, followers),
    videosPer1kFollowers: ratio(snapshot.videoCount * 1000, followers),
    hubPoints: points,
    streakCount: profile?.streakCount ?? 0,
    room,
  };
}

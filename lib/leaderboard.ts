import { prisma } from "@/lib/prisma";
import { getMemberAvatarUrl, getMemberDisplayName } from "@/lib/memberDisplay";
import { isOnline } from "@/lib/presence";

export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all";

export const LEADERBOARD_PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "all", label: "All time" },
];

/** Period bounds in UTC (Monday-start weeks). */
export function periodStart(period: LeaderboardPeriod, now = new Date()): Date | null {
  if (period === "all") return null;
  if (period === "daily") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (period === "weekly") {
    const day = now.getUTCDay(); // 0 = Sun
    const daysFromMonday = (day + 6) % 7;
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday)
    );
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  points: number;
  name: string;
  image: string | null;
  online: boolean;
};

/**
 * Rank ACTIVE members by XP earned (positive XPEvent amounts only) in the
 * period — redemptions don't tank the board.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  opts?: { take?: number; viewerId?: string }
): Promise<{ entries: LeaderboardEntry[]; viewer: LeaderboardEntry | null }> {
  const take = opts?.take ?? 50;
  const start = periodStart(period);

  const grouped = await prisma.xPEvent.groupBy({
    by: ["userId"],
    where: {
      amount: { gt: 0 },
      ...(start ? { createdAt: { gte: start } } : {}),
      user: { status: "ACTIVE", hiddenFromDirectory: false },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 200,
  });

  const ranked = grouped
    .map((row) => ({ userId: row.userId, points: row._sum.amount ?? 0 }))
    .filter((row) => row.points > 0);

  const top = ranked.slice(0, take);
  const ids = Array.from(new Set(top.map((r) => r.userId)));
  if (opts?.viewerId && !ids.includes(opts.viewerId)) {
    ids.push(opts.viewerId);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      image: true,
      lastSeenAt: true,
      profile: { select: { socialLinks: true, username: true, showRealName: true } },
      tiktokConnection: { select: { displayName: true, avatarUrl: true } },
    },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  function toEntry(userId: string, points: number, rank: number): LeaderboardEntry | null {
    const user = byId.get(userId);
    if (!user) return null;
    return {
      rank,
      userId,
      points,
      name: getMemberDisplayName(user),
      image: getMemberAvatarUrl(user) || user.image,
      online: isOnline(user.lastSeenAt),
    };
  }

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < top.length; i++) {
    const entry = toEntry(top[i]!.userId, top[i]!.points, i + 1);
    if (entry) entries.push(entry);
  }

  let viewer: LeaderboardEntry | null = null;
  if (opts?.viewerId) {
    const idx = ranked.findIndex((r) => r.userId === opts.viewerId);
    if (idx >= 0) {
      viewer = toEntry(ranked[idx]!.userId, ranked[idx]!.points, idx + 1);
    } else {
      viewer = toEntry(opts.viewerId, 0, ranked.length + 1);
    }
  }

  return { entries, viewer };
}

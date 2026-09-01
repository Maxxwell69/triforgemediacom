import "server-only";
import { prisma } from "@/lib/prisma";
import { CN_TAG_NAME, MN_TAG_NAME, type NetworkTrack } from "@/lib/mnCn";
import { getChatDisplayName } from "@/lib/memberDisplay";

export type NetworkDashboardTrackFilter = "ALL" | NetworkTrack;

export type NetworkCreatorRow = {
  userId: string;
  name: string;
  email: string;
  track: NetworkTrack | "UNKNOWN";
  uniqueId: string | null;
  followers: number;
  hearts: number;
  videos: number;
  verified: boolean;
  isLive: boolean;
  liveViewers: number | null;
  leagueLabel: string | null;
  leagueRank: number | null;
  streak: number;
  lastSeenAt: Date | null;
};

export type NetworkDashboardData = {
  track: NetworkDashboardTrackFilter;
  generatedAt: Date;
  counts: {
    activeCreators: number;
    invited: number;
    withTikTokStats: number;
    verified: number;
    currentlyLive: number;
    liveViewersTotal: number;
    pendingApplications: number;
    tiktokNetworkRequested: number;
    unseenLast7d: number;
    activeLast7d: number;
  };
  reach: {
    followersTotal: number;
    followersAvg: number;
    followersMedian: number;
    heartsTotal: number;
    heartsAvg: number;
    videosTotal: number;
    videosAvg: number;
    buckets: { label: string; count: number }[];
  };
  league: {
    withLeagueData: number;
    byClass: { label: string; count: number }[];
    topRanked: NetworkCreatorRow[];
  };
  live: {
    creators: NetworkCreatorRow[];
    avgViewers: number;
    maxViewers: number;
  };
  hub: {
    xpTotal: number;
    xpLast7d: number;
    tikTaskDoneLast7d: number;
    tikTaskDoneLast30d: number;
    tikTaskDoneToday: number;
    streakAvg: number;
    streakMax: number;
    messagesLast7d: number;
    webinarJoinsLast30d: number;
    courseEnrollments: number;
    topStreaks: { userId: string; name: string; streak: number }[];
    topXp: { userId: string; name: string; xp: number }[];
  };
  topByFollowers: NetworkCreatorRow[];
  topByHearts: NetworkCreatorRow[];
  limitations: string[];
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function followerBucket(n: number): string {
  if (n < 1_000) return "0–1K";
  if (n < 10_000) return "1K–10K";
  if (n < 100_000) return "10K–100K";
  if (n < 1_000_000) return "100K–1M";
  return "1M+";
}

function trackWhere(track: NetworkDashboardTrackFilter) {
  if (track === "ALL") {
    return {
      OR: [
        { tags: { some: { tag: { name: { equals: CN_TAG_NAME, mode: "insensitive" as const } } } } },
        { tags: { some: { tag: { name: { equals: MN_TAG_NAME, mode: "insensitive" as const } } } } },
        { groupMemberships: { some: { group: { name: { equals: CN_TAG_NAME, mode: "insensitive" as const } } } } },
        { groupMemberships: { some: { group: { name: { equals: MN_TAG_NAME, mode: "insensitive" as const } } } } },
        { application: { is: { answers: { path: ["track"], equals: "CN" } } } },
        { application: { is: { answers: { path: ["track"], equals: "MN" } } } },
      ],
    };
  }
  const name = track === "CN" ? CN_TAG_NAME : MN_TAG_NAME;
  return {
    OR: [
      { tags: { some: { tag: { name: { equals: name, mode: "insensitive" as const } } } } },
      {
        groupMemberships: {
          some: { group: { name: { equals: name, mode: "insensitive" as const } } },
        },
      },
      { application: { is: { answers: { path: ["track"], equals: track } } } },
    ],
  };
}

function resolveTrack(user: {
  tags: { tag: { name: string } }[];
  groupMemberships: { group: { name: string } }[];
  application: { answers: unknown } | null;
}): NetworkTrack | "UNKNOWN" {
  const names = new Set(
    [
      ...user.tags.map((t) => t.tag.name.toUpperCase()),
      ...user.groupMemberships.map((g) => g.group.name.toUpperCase()),
    ].filter(Boolean)
  );
  const hasCn = names.has("CN");
  const hasMn = names.has("MN");
  if (hasCn && !hasMn) return "CN";
  if (hasMn && !hasCn) return "MN";
  if (hasCn) return "CN";
  if (hasMn) return "MN";
  const answers = user.application?.answers;
  if (answers && typeof answers === "object") {
    const track = (answers as Record<string, unknown>).track;
    if (track === "CN" || track === "MN") return track;
  }
  return "UNKNOWN";
}

function toRow(user: {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: Date | null;
  profile: { username: string | null; socialLinks: unknown; streakCount: number; showRealName: boolean } | null;
  tiktokConnection: { displayName: string | null; avatarUrl: string | null } | null;
  tiktokStatsSnapshot: {
    uniqueId: string;
    nickname: string | null;
    avatarUrl: string | null;
    verified: boolean;
    followerCount: number;
    heartCount: number;
    videoCount: number;
    isLive: boolean;
    liveViewerCount: number | null;
    leagueLabel: string | null;
    leagueRank: number | null;
    liveCheckedAt: Date | null;
  } | null;
  tags: { tag: { name: string } }[];
  groupMemberships: { group: { name: string } }[];
  application: { answers: unknown } | null;
}): NetworkCreatorRow {
  const snap = user.tiktokStatsSnapshot;
  const liveFresh =
    !!snap?.isLive &&
    !!snap.liveCheckedAt &&
    snap.liveCheckedAt.getTime() >= Date.now() - 90 * 60 * 1000;

  return {
    userId: user.id,
    name: getChatDisplayName({
      name: user.name,
      profile: user.profile,
      tiktokConnection: user.tiktokConnection,
      tiktokStatsSnapshot: snap,
    }),
    email: user.email,
    track: resolveTrack(user),
    uniqueId: snap?.uniqueId ?? null,
    followers: snap?.followerCount ?? 0,
    hearts: snap?.heartCount ?? 0,
    videos: snap?.videoCount ?? 0,
    verified: snap?.verified ?? false,
    isLive: liveFresh,
    liveViewers: liveFresh ? snap?.liveViewerCount ?? null : null,
    leagueLabel: snap?.leagueLabel ?? null,
    leagueRank: snap?.leagueRank ?? null,
    streak: user.profile?.streakCount ?? 0,
    lastSeenAt: user.lastSeenAt,
  };
}

/**
 * Aggregate Network Creator dashboard stats for CN, MN, or both.
 * Uses current TikTok snapshots + hub activity — no historical diamond earnings.
 */
export async function loadNetworkDashboard(
  track: NetworkDashboardTrackFilter = "ALL"
): Promise<NetworkDashboardData> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const whereTrack = trackWhere(track);

  const [
    activeUsers,
    invitedCount,
    pendingApplications,
    tiktokNetworkRequested,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        hiddenFromDirectory: false,
        ...whereTrack,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastSeenAt: true,
        profile: {
          select: {
            username: true,
            socialLinks: true,
            streakCount: true,
            showRealName: true,
          },
        },
        tiktokConnection: { select: { displayName: true, avatarUrl: true } },
        tiktokStatsSnapshot: {
          select: {
            uniqueId: true,
            nickname: true,
            avatarUrl: true,
            verified: true,
            followerCount: true,
            heartCount: true,
            videoCount: true,
            isLive: true,
            liveViewerCount: true,
            leagueLabel: true,
            leagueRank: true,
            liveCheckedAt: true,
          },
        },
        tags: { select: { tag: { select: { name: true } } } },
        groupMemberships: { select: { group: { select: { name: true } } } },
        application: { select: { answers: true } },
      },
    }),
    prisma.user.count({
      where: { status: "INVITED", ...whereTrack },
    }),
    prisma.application.count({
      where: {
        status: "PENDING",
        ...(track === "ALL"
          ? {
              OR: [
                { answers: { path: ["track"], equals: "CN" } },
                { answers: { path: ["track"], equals: "MN" } },
              ],
            }
          : { answers: { path: ["track"], equals: track } }),
      },
    }),
    track === "MN"
      ? Promise.resolve(0)
      : prisma.application.count({
          where: {
            tiktokNetworkRequested: true,
            ...(track === "CN" ? { answers: { path: ["track"], equals: "CN" } } : {}),
          },
        }),
  ]);

  const rows = activeUsers.map(toRow);
  const userIds = rows.map((r) => r.userId);
  const withStats = rows.filter((r) => r.uniqueId);
  const liveRows = rows.filter((r) => r.isLive);
  const liveViewers = liveRows
    .map((r) => r.liveViewers)
    .filter((n): n is number => n != null && n >= 0);

  const followers = withStats.map((r) => r.followers);
  const hearts = withStats.map((r) => r.hearts);
  const videos = withStats.map((r) => r.videos);
  const streaks = rows.map((r) => r.streak);

  const bucketOrder = ["0–1K", "1K–10K", "10K–100K", "100K–1M", "1M+"];
  const bucketCounts = new Map(bucketOrder.map((l) => [l, 0]));
  for (const n of followers) {
    const key = followerBucket(n);
    bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1);
  }

  const leagueMap = new Map<string, number>();
  for (const r of withStats) {
    if (!r.leagueLabel) continue;
    leagueMap.set(r.leagueLabel, (leagueMap.get(r.leagueLabel) || 0) + 1);
  }
  const byClass = Array.from(leagueMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const topRanked = [...withStats]
    .filter((r) => r.leagueRank != null)
    .sort((a, b) => (a.leagueRank ?? 999999) - (b.leagueRank ?? 999999))
    .slice(0, 10);

  const topByFollowers = [...withStats]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 10);
  const topByHearts = [...withStats]
    .sort((a, b) => b.hearts - a.hearts)
    .slice(0, 10);

  const [
    xpAll,
    xpWeek,
    tikTask7,
    tikTask30,
    tikTaskToday,
    messagesLast7d,
    webinarJoinsLast30d,
    courseEnrollments,
    xpByUser,
  ] = userIds.length
    ? await Promise.all([
        prisma.xPEvent.aggregate({
          where: { userId: { in: userIds } },
          _sum: { amount: true },
        }),
        prisma.xPEvent.aggregate({
          where: { userId: { in: userIds }, createdAt: { gte: weekAgo } },
          _sum: { amount: true },
        }),
        prisma.dailyTask.count({
          where: {
            userId: { in: userIds },
            status: "DONE",
            completedAt: { gte: weekAgo },
          },
        }),
        prisma.dailyTask.count({
          where: {
            userId: { in: userIds },
            status: "DONE",
            completedAt: { gte: monthAgo },
          },
        }),
        prisma.dailyTask.count({
          where: {
            userId: { in: userIds },
            status: "DONE",
            completedAt: { gte: todayStart },
          },
        }),
        prisma.message.count({
          where: { userId: { in: userIds }, createdAt: { gte: weekAgo } },
        }),
        prisma.webinarAttendance.count({
          where: { userId: { in: userIds }, joinedAt: { gte: monthAgo } },
        }),
        prisma.enrollment.count({
          where: { userId: { in: userIds } },
        }),
        prisma.xPEvent.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 10,
        }),
      ])
    : [
        { _sum: { amount: 0 } },
        { _sum: { amount: 0 } },
        0,
        0,
        0,
        0,
        0,
        0,
        [] as { userId: string; _sum: { amount: number | null } }[],
      ];

  const nameById = new Map(rows.map((r) => [r.userId, r.name]));
  const topXp = (xpByUser as { userId: string; _sum: { amount: number | null } }[]).map(
    (row) => ({
      userId: row.userId,
      name: nameById.get(row.userId) || "Member",
      xp: row._sum.amount ?? 0,
    })
  );

  const topStreaks = [...rows]
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 10)
    .filter((r) => r.streak > 0)
    .map((r) => ({ userId: r.userId, name: r.name, streak: r.streak }));

  const activeLast7d = rows.filter(
    (r) => r.lastSeenAt && r.lastSeenAt.getTime() >= weekAgo.getTime()
  ).length;

  return {
    track,
    generatedAt: now,
    counts: {
      activeCreators: rows.length,
      invited: invitedCount,
      withTikTokStats: withStats.length,
      verified: withStats.filter((r) => r.verified).length,
      currentlyLive: liveRows.length,
      liveViewersTotal: liveViewers.reduce((a, b) => a + b, 0),
      pendingApplications,
      tiktokNetworkRequested,
      unseenLast7d: rows.length - activeLast7d,
      activeLast7d,
    },
    reach: {
      followersTotal: followers.reduce((a, b) => a + b, 0),
      followersAvg: avg(followers),
      followersMedian: median(followers),
      heartsTotal: hearts.reduce((a, b) => a + b, 0),
      heartsAvg: avg(hearts),
      videosTotal: videos.reduce((a, b) => a + b, 0),
      videosAvg: avg(videos),
      buckets: bucketOrder.map((label) => ({
        label,
        count: bucketCounts.get(label) || 0,
      })),
    },
    league: {
      withLeagueData: withStats.filter((r) => r.leagueLabel).length,
      byClass,
      topRanked,
    },
    live: {
      creators: liveRows.sort((a, b) => (b.liveViewers ?? 0) - (a.liveViewers ?? 0)),
      avgViewers: avg(liveViewers),
      maxViewers: liveViewers.length ? Math.max(...liveViewers) : 0,
    },
    hub: {
      xpTotal: xpAll._sum.amount ?? 0,
      xpLast7d: xpWeek._sum.amount ?? 0,
      tikTaskDoneLast7d: tikTask7 as number,
      tikTaskDoneLast30d: tikTask30 as number,
      tikTaskDoneToday: tikTaskToday as number,
      streakAvg: avg(streaks),
      streakMax: streaks.length ? Math.max(...streaks) : 0,
      messagesLast7d: messagesLast7d as number,
      webinarJoinsLast30d: webinarJoinsLast30d as number,
      courseEnrollments: courseEnrollments as number,
      topStreaks,
      topXp,
    },
    topByFollowers,
    topByHearts,
    limitations: [
      "Diamond earnings / gifts are not stored — only Diamond Rush league class & rank when tik.tools returns them.",
      "Live session history is kept from this release onward — earlier go-lives were not stored.",
      "Follower/likes growth charts need snapshot history (current stats are overwrite-only).",
    ],
  };
}

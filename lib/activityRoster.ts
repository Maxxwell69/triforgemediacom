import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CN_TAG_NAME, MN_TAG_NAME, type NetworkTrack } from "@/lib/mnCn";
import { getChatDisplayName } from "@/lib/memberDisplay";
import { liveNotStaleWhere } from "@/lib/tiktokLive";

export type RosterHubFilter =
  | "all"
  | "in_hub"
  | "never"
  | "new_7d"
  | "new_30d"
  | "active_7d"
  | "quiet_7d";

export type RosterLiveFilter = "all" | "ever" | "never" | "live_now";

export type RosterSort =
  | "lastSeen"
  | "lastLogin"
  | "created"
  | "name"
  | "liveCount"
  | "xp"
  | "level";

export type RosterTrackFilter = "ALL" | NetworkTrack;

export type ActivityRosterRow = {
  userId: string;
  name: string;
  email: string;
  status: string;
  track: NetworkTrack | "UNKNOWN";
  levelName: string | null;
  levelOrder: number | null;
  createdAt: Date;
  firstLoginAt: Date | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  streak: number;
  xp: number;
  tikTask7d: number;
  messages7d: number;
  liveCount: number;
  lastLiveAt: Date | null;
  isLiveNow: boolean;
  uniqueId: string | null;
};

export type ActivityRosterResult = {
  rows: ActivityRosterRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: {
    total: number;
    inHub: number;
    never: number;
    new7d: number;
    active7d: number;
    liveNow: number;
  };
};

const PAGE_SIZE = 75;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
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
  if (names.has("CN") && !names.has("MN")) return "CN";
  if (names.has("MN") && !names.has("CN")) return "MN";
  if (names.has("CN")) return "CN";
  if (names.has("MN")) return "MN";
  const answers = user.application?.answers;
  if (answers && typeof answers === "object") {
    const track = (answers as Record<string, unknown>).track;
    if (track === "CN" || track === "MN") return track;
  }
  return "UNKNOWN";
}

function trackWhere(track: RosterTrackFilter): Prisma.UserWhereInput | null {
  if (track === "ALL") return null;
  const name = track === "CN" ? CN_TAG_NAME : MN_TAG_NAME;
  return {
    OR: [
      { tags: { some: { tag: { name: { equals: name, mode: "insensitive" } } } } },
      { groupMemberships: { some: { group: { name: { equals: name, mode: "insensitive" } } } } },
      { application: { is: { answers: { path: ["track"], equals: track } } } },
    ],
  };
}

export async function loadActivityRoster(opts: {
  q?: string;
  track?: RosterTrackFilter;
  hub?: RosterHubFilter;
  live?: RosterLiveFilter;
  levelId?: string;
  sort?: RosterSort;
  page?: number;
}): Promise<ActivityRosterResult> {
  const q = (opts.q || "").trim();
  const qBare = q.replace(/^@/, "");
  const track = opts.track || "ALL";
  const hub = opts.hub || "all";
  const live = opts.live || "all";
  const sort = opts.sort || "lastSeen";
  const page = Math.max(1, opts.page || 1);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const where: Prisma.UserWhereInput = {
    status: { in: ["ACTIVE", "INVITED"] },
    hiddenFromDirectory: false,
  };

  const and: Prisma.UserWhereInput[] = [];
  const tw = trackWhere(track);
  if (tw) and.push(tw);

  if (hub === "in_hub") and.push({ lastLoginAt: { not: null } });
  if (hub === "never") and.push({ lastLoginAt: null });
  if (hub === "new_7d") {
    and.push({
      OR: [{ firstLoginAt: { gte: weekAgo } }, { lastLoginAt: { gte: weekAgo }, firstLoginAt: null }],
    });
  }
  if (hub === "new_30d") {
    and.push({
      OR: [{ firstLoginAt: { gte: monthAgo } }, { lastLoginAt: { gte: monthAgo }, firstLoginAt: null }],
    });
  }
  if (hub === "active_7d") and.push({ lastSeenAt: { gte: weekAgo } });
  if (hub === "quiet_7d") {
    and.push({
      lastLoginAt: { not: null },
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: weekAgo } }],
    });
  }

  if (opts.levelId === "none") {
    and.push({
      OR: [{ progressionProfile: null }, { progressionProfile: { currentLevelId: null } }],
    });
  } else if (opts.levelId) {
    and.push({ progressionProfile: { currentLevelId: opts.levelId } });
  }

  if (live === "live_now") {
    and.push({ tiktokStatsSnapshot: { is: liveNotStaleWhere() } });
  } else if (live === "ever") {
    and.push({ liveSessions: { some: {} } });
  } else if (live === "never") {
    and.push({ liveSessions: { none: {} } });
  }

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { profile: { username: { contains: qBare, mode: "insensitive" } } },
        { tiktokStatsSnapshot: { uniqueId: { contains: qBare, mode: "insensitive" } } },
      ],
    });
  }

  if (and.length) where.AND = and;

  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }, { email: "asc" }]
      : sort === "lastLogin"
        ? [{ lastLoginAt: { sort: "desc", nulls: "last" } }]
        : sort === "created"
          ? [{ createdAt: "desc" }]
          : [{ lastSeenAt: { sort: "desc", nulls: "last" } }];

  const [users, total, inHub, never, new7d, active7d, liveNow] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        firstLoginAt: true,
        lastLoginAt: true,
        lastSeenAt: true,
        profile: {
          select: { username: true, socialLinks: true, streakCount: true, showRealName: true },
        },
        tiktokConnection: { select: { displayName: true, avatarUrl: true } },
        tiktokStatsSnapshot: {
          select: {
            uniqueId: true,
            nickname: true,
            avatarUrl: true,
            isLive: true,
            liveCheckedAt: true,
          },
        },
        progressionProfile: {
          select: {
            currentLevel: { select: { id: true, name: true, sortOrder: true } },
          },
        },
        tags: { select: { tag: { select: { name: true } } } },
        groupMemberships: { select: { group: { select: { name: true } } } },
        application: { select: { answers: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({
      where: { status: { in: ["ACTIVE", "INVITED"] }, hiddenFromDirectory: false, lastLoginAt: { not: null } },
    }),
    prisma.user.count({
      where: { status: { in: ["ACTIVE", "INVITED"] }, hiddenFromDirectory: false, lastLoginAt: null },
    }),
    prisma.user.count({
      where: {
        status: { in: ["ACTIVE", "INVITED"] },
        hiddenFromDirectory: false,
        firstLoginAt: { gte: weekAgo },
      },
    }),
    prisma.user.count({
      where: {
        status: { in: ["ACTIVE", "INVITED"] },
        hiddenFromDirectory: false,
        lastSeenAt: { gte: weekAgo },
      },
    }),
    prisma.tikTokStatsSnapshot.count({ where: liveNotStaleWhere() }),
  ]);

  const ids = users.map((u) => u.id);
  const emptyAgg = [] as { userId: string; _sum?: { amount: number | null }; _count?: { _all: number }; _max?: { startedAt: Date | null } }[];

  const [xpRows, taskRows, msgRows, liveAgg] =
    ids.length === 0
      ? [emptyAgg, emptyAgg, emptyAgg, emptyAgg]
      : await Promise.all([
          prisma.xPEvent.groupBy({
            by: ["userId"],
            where: { userId: { in: ids } },
            _sum: { amount: true },
          }),
          prisma.dailyTask.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, status: "DONE", completedAt: { gte: weekAgo } },
            _count: { _all: true },
          }),
          prisma.message.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, createdAt: { gte: weekAgo } },
            _count: { _all: true },
          }),
          prisma.tikTokLiveSession.groupBy({
            by: ["userId"],
            where: { userId: { in: ids } },
            _count: { _all: true },
            _max: { startedAt: true },
          }),
        ]);

  const xpBy = new Map(xpRows.map((r) => [r.userId, r._sum?.amount ?? 0]));
  const taskBy = new Map(taskRows.map((r) => [r.userId, r._count?._all ?? 0]));
  const msgBy = new Map(msgRows.map((r) => [r.userId, r._count?._all ?? 0]));
  const liveBy = new Map(
    liveAgg.map((r) => [r.userId, { count: r._count?._all ?? 0, last: r._max?.startedAt ?? null }])
  );

  let rows: ActivityRosterRow[] = users.map((user) => {
    const live = liveBy.get(user.id);
    const snap = user.tiktokStatsSnapshot;
    const liveNow =
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
      status: user.status,
      track: resolveTrack(user),
      levelName: user.progressionProfile?.currentLevel?.name ?? null,
      levelOrder: user.progressionProfile?.currentLevel?.sortOrder ?? null,
      createdAt: user.createdAt,
      firstLoginAt: user.firstLoginAt,
      lastLoginAt: user.lastLoginAt,
      lastSeenAt: user.lastSeenAt,
      streak: user.profile?.streakCount ?? 0,
      xp: xpBy.get(user.id) ?? 0,
      tikTask7d: taskBy.get(user.id) ?? 0,
      messages7d: msgBy.get(user.id) ?? 0,
      liveCount: live?.count ?? 0,
      lastLiveAt: live?.last ?? null,
      isLiveNow: liveNow,
      uniqueId: snap?.uniqueId ?? null,
    };
  });

  if (sort === "liveCount") {
    rows = [...rows].sort((a, b) => b.liveCount - a.liveCount || a.name.localeCompare(b.name));
  } else if (sort === "xp") {
    rows = [...rows].sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  } else if (sort === "level") {
    rows = [...rows].sort(
      (a, b) => (b.levelOrder ?? -1) - (a.levelOrder ?? -1) || a.name.localeCompare(b.name)
    );
  }

  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    counts: { total, inHub, never, new7d, active7d, liveNow },
  };
}

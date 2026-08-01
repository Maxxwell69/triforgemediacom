import { prisma } from "@/lib/prisma";
import {
  bulkCheckLive,
  checkLive,
  isTikToolsConfigured,
  parseTikTokUniqueId,
  type TikToolsBulkLiveRow,
} from "@/lib/tiktools";
import { ensureTikTokSocialLink } from "@/lib/tiktokStats";

export const LIVE_TAG_NAME = "LIVE";
export const LIVE_TAG_COLOR = "#FD4802";

/** Hide / clear LIVE if we haven't confirmed liveness within this window. */
export const LIVE_STALE_MS = 12 * 60 * 1000;

/** Admin-only tag so members can't self-assign fake LIVE status. */
export async function ensureLiveTag() {
  return prisma.tag.upsert({
    where: { name: LIVE_TAG_NAME },
    update: {
      color: LIVE_TAG_COLOR,
      selfAssignable: false,
      description: "Currently live on TikTok — managed automatically by the hub.",
    },
    create: {
      name: LIVE_TAG_NAME,
      color: LIVE_TAG_COLOR,
      selfAssignable: false,
      description: "Currently live on TikTok — managed automatically by the hub.",
    },
  });
}

export async function syncLiveTagForUser(userId: string, isLive: boolean): Promise<void> {
  const tag = await ensureLiveTag();
  if (isLive) {
    await prisma.userTag.upsert({
      where: { userId_tagId: { userId, tagId: tag.id } },
      update: {},
      create: { userId, tagId: tag.id },
    });
  } else {
    await prisma.userTag.deleteMany({ where: { userId, tagId: tag.id } });
  }
}

type RosterMember = {
  userId: string;
  uniqueId: string;
};

async function loadLiveRoster(): Promise<RosterMember[]> {
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      profile: { isNot: null },
      hiddenFromDirectory: false,
    },
    select: {
      id: true,
      profile: { select: { socialLinks: true } },
      tiktokStatsSnapshot: { select: { uniqueId: true } },
    },
  });

  const roster: RosterMember[] = [];
  const seen = new Set<string>();

  for (const user of users) {
    const fromSnapshot = user.tiktokStatsSnapshot?.uniqueId?.toLowerCase() || null;
    const fromLinks = parseTikTokUniqueId(
      ((user.profile?.socialLinks as Record<string, string> | null) ?? {}).tiktok
    );
    const uniqueId = fromSnapshot || fromLinks;
    if (!uniqueId || seen.has(uniqueId)) continue;
    seen.add(uniqueId);
    roster.push({ userId: user.id, uniqueId });
  }

  return roster;
}

const BULK_CHUNK = 50;

async function applyLiveStatus(
  userId: string,
  uniqueId: string,
  status: { isLive: boolean; roomId: string | null; title: string | null; viewerCount: number | null }
) {
  const now = new Date();
  await prisma.tikTokStatsSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      uniqueId,
      isLive: status.isLive,
      roomId: status.isLive ? status.roomId : null,
      liveTitle: status.isLive ? status.title : null,
      liveViewerCount: status.isLive ? status.viewerCount : null,
      liveCheckedAt: now,
    },
    update: {
      uniqueId,
      isLive: status.isLive,
      roomId: status.isLive ? status.roomId : null,
      liveTitle: status.isLive ? status.title : null,
      liveViewerCount: status.isLive ? status.viewerCount : null,
      liveCheckedAt: now,
    },
  });
  await syncLiveTagForUser(userId, status.isLive);
}

/**
 * Poll tik.tools for who is live, update TikTokStatsSnapshot, and sync LIVE tags.
 * Also backfills missing socialLinks.tiktok from application handles first.
 */
export async function syncRosterLiveStatus(): Promise<{
  backfilled: number;
  checked: number;
  live: number;
  updated: number;
  unknown: number;
  clearedStale: number;
}> {
  if (!isTikToolsConfigured()) {
    throw new Error("TIKTOOLS_API_KEY is not configured");
  }

  // Keep social links populated so member profiles show TikTok handles
  const activeUsers = await prisma.user.findMany({
    where: { status: "ACTIVE", profile: { isNot: null } },
    select: { id: true },
  });
  let filled = 0;
  for (const user of activeUsers) {
    if (await ensureTikTokSocialLink(user.id)) filled++;
  }

  await ensureLiveTag();

  const roster = await loadLiveRoster();
  let live = 0;
  let updated = 0;
  let unknown = 0;
  const checkedUserIds = new Set<string>();

  for (let i = 0; i < roster.length; i += BULK_CHUNK) {
    const chunk = roster.slice(i, i + BULK_CHUNK);
    let results: TikToolsBulkLiveRow[] = [];
    try {
      results = await bulkCheckLive(chunk.map((r) => r.uniqueId));
    } catch (err) {
      console.error("bulkCheckLive failed, falling back to checkLive:", err);
    }
    const byId = new Map(results.map((r) => [r.uniqueId, r]));

    for (const member of chunk) {
      checkedUserIds.add(member.userId);
      const existing = await prisma.tikTokStatsSnapshot.findUnique({
        where: { userId: member.userId },
        select: { isLive: true, liveCheckedAt: true },
      });

      let row = byId.get(member.uniqueId);

      // API often omits offline creators — missing row means offline unless we
      // still need a definitive check for someone currently marked live.
      if (!row) {
        row = {
          uniqueId: member.uniqueId,
          isLive: false,
          unknown: false,
          roomId: null,
          title: null,
          viewerCount: null,
        };
      }

      if (row.unknown) {
        // Don't trust "unknown" to keep someone live forever — re-check
        if (existing?.isLive) {
          try {
            const definitive = await checkLive(member.uniqueId);
            row = {
              uniqueId: member.uniqueId,
              isLive: definitive.isLive,
              unknown: false,
              roomId: definitive.roomId,
              title: definitive.title,
              viewerCount: definitive.viewerCount,
            };
          } catch (err) {
            console.error(`checkLive failed for @${member.uniqueId}:`, err);
            unknown++;
            const stale =
              !existing.liveCheckedAt ||
              Date.now() - existing.liveCheckedAt.getTime() > LIVE_STALE_MS;
            if (stale) {
              await applyLiveStatus(member.userId, member.uniqueId, {
                isLive: false,
                roomId: null,
                title: null,
                viewerCount: null,
              });
              updated++;
            }
            continue;
          }
        } else {
          unknown++;
          continue;
        }
      }

      await applyLiveStatus(member.userId, member.uniqueId, {
        isLive: row.isLive,
        roomId: row.roomId,
        title: row.title,
        viewerCount: row.viewerCount,
      });

      if (row.isLive) live++;
      if (!existing || existing.isLive !== row.isLive) updated++;
    }
  }

  // Anyone still marked live who wasn't in this roster pass → clear
  const stuckLive = await prisma.tikTokStatsSnapshot.findMany({
    where: {
      isLive: true,
      userId: { notIn: [...checkedUserIds] },
    },
    select: { userId: true, uniqueId: true },
  });
  let clearedStale = 0;
  for (const snap of stuckLive) {
    await applyLiveStatus(snap.userId, snap.uniqueId, {
      isLive: false,
      roomId: null,
      title: null,
      viewerCount: null,
    });
    clearedStale++;
    updated++;
  }

  // Stale cutoff: still "live" but last confirmed too long ago
  const staleCutoff = new Date(Date.now() - LIVE_STALE_MS);
  const staleLive = await prisma.tikTokStatsSnapshot.findMany({
    where: {
      isLive: true,
      OR: [{ liveCheckedAt: null }, { liveCheckedAt: { lt: staleCutoff } }],
    },
    select: { userId: true, uniqueId: true },
  });
  for (const snap of staleLive) {
    // One last definitive check before clearing
    try {
      const definitive = await checkLive(snap.uniqueId);
      await applyLiveStatus(snap.userId, snap.uniqueId, {
        isLive: definitive.isLive,
        roomId: definitive.roomId,
        title: definitive.title,
        viewerCount: definitive.viewerCount,
      });
      if (!definitive.isLive) clearedStale++;
      if (definitive.isLive) live++;
    } catch {
      await applyLiveStatus(snap.userId, snap.uniqueId, {
        isLive: false,
        roomId: null,
        title: null,
        viewerCount: null,
      });
      clearedStale++;
    }
    updated++;
  }

  // Clear LIVE tags for anyone no longer live in snapshot
  const liveTag = await ensureLiveTag();
  const liveUserIds = (
    await prisma.tikTokStatsSnapshot.findMany({
      where: { isLive: true },
      select: { userId: true },
    })
  ).map((s) => s.userId);

  await prisma.userTag.deleteMany({
    where: {
      tagId: liveTag.id,
      ...(liveUserIds.length > 0 ? { userId: { notIn: liveUserIds } } : {}),
    },
  });

  // Recompute live count from DB (authoritative after clears)
  const liveFinal = await prisma.tikTokStatsSnapshot.count({ where: { isLive: true } });

  return {
    backfilled: filled,
    checked: roster.length,
    live: liveFinal,
    updated,
    unknown,
    clearedStale,
  };
}

/** Prisma filter: only recently confirmed live creators. */
export function liveNotStaleWhere(now = new Date()) {
  return {
    isLive: true as const,
    liveCheckedAt: { gte: new Date(now.getTime() - LIVE_STALE_MS) },
  };
}

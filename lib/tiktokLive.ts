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

/**
 * Hide / clear LIVE if we haven't confirmed liveness within this window.
 * Sized for GitHub Actions cron drift (often 30–120+ min between runs, not a
 * true every-5-minute cadence) so creators don't vanish from /live mid-stream.
 */
export const LIVE_STALE_MS = 90 * 60 * 1000;

/** Re-poll tik.tools when someone opens /live and data is older than this. */
export const LIVE_PAGE_REFRESH_MS = 4 * 60 * 1000;

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
  await recordLiveSession(userId, uniqueId, status, now);
}

async function recordLiveSession(
  userId: string,
  uniqueId: string,
  status: { isLive: boolean; roomId: string | null; title: string | null; viewerCount: number | null },
  now: Date
) {
  if (status.isLive) {
    const open = await prisma.tikTokLiveSession.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (open) {
      await prisma.tikTokLiveSession.update({
        where: { id: open.id },
        data: {
          lastSeenLiveAt: now,
          peakViewers: Math.max(open.peakViewers, status.viewerCount ?? 0),
          roomId: status.roomId ?? open.roomId,
          title: status.title ?? open.title,
          uniqueId,
        },
      });
      return;
    }
    const created = await prisma.tikTokLiveSession.create({
      data: {
        userId,
        uniqueId,
        roomId: status.roomId,
        title: status.title,
        startedAt: now,
        lastSeenLiveAt: now,
        peakViewers: status.viewerCount ?? 0,
      },
    });
    const { fireCampaignEventSafe } = await import("@/lib/campaigns/engine");
    fireCampaignEventSafe({
      type: "WENT_LIVE",
      userId,
      payload: { sessionId: created.id },
    });
    return;
  }

  await prisma.tikTokLiveSession.updateMany({
    where: { userId, endedAt: null },
    data: { endedAt: now, lastSeenLiveAt: now },
  });
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
  let updated = 0;
  let unknown = 0;
  const checkedUserIds = new Set<string>();

  async function resolveDefinitive(uniqueId: string): Promise<TikToolsBulkLiveRow | null> {
    try {
      const definitive = await checkLive(uniqueId);
      return {
        uniqueId,
        isLive: definitive.isLive,
        unknown: false,
        roomId: definitive.roomId,
        title: definitive.title,
        viewerCount: definitive.viewerCount,
      };
    } catch (err) {
      console.error(`checkLive failed for @${uniqueId}:`, err);
      return null;
    }
  }

  for (let i = 0; i < roster.length; i += BULK_CHUNK) {
    const chunk = roster.slice(i, i + BULK_CHUNK);
    let results: TikToolsBulkLiveRow[] = [];
    let bulkOk = false;
    try {
      results = await bulkCheckLive(chunk.map((r) => r.uniqueId));
      // Empty payload for a non-empty chunk is not a successful poll — fall back.
      bulkOk = results.length > 0 || chunk.length === 0;
      if (!bulkOk) {
        console.error(
          `bulkCheckLive returned 0 rows for ${chunk.length} handles — falling back to checkLive`
        );
      }
    } catch (err) {
      console.error("bulkCheckLive failed, falling back to checkLive:", err);
    }

    const byId = new Map<string, TikToolsBulkLiveRow>();
    for (let j = 0; j < results.length; j++) {
      const row = results[j];
      // Prefer API unique_id; if missing, align by request order.
      const uniqueId = row.uniqueId || chunk[j]?.uniqueId;
      if (!uniqueId) continue;
      byId.set(uniqueId, { ...row, uniqueId });
    }

    for (const member of chunk) {
      checkedUserIds.add(member.userId);
      const existing = await prisma.tikTokStatsSnapshot.findUnique({
        where: { userId: member.userId },
        select: { isLive: true, liveCheckedAt: true },
      });

      let row: TikToolsBulkLiveRow | undefined = byId.get(member.uniqueId);

      if (!bulkOk) {
        // Don't mass-flip everyone offline when bulk is broken — ask TikTok per user.
        const definitive = await resolveDefinitive(member.uniqueId);
        if (!definitive) {
          unknown++;
          continue;
        }
        row = definitive;
      } else if (!row) {
        // Partial bulk responses (tier caps / omissions) leave people out of the
        // map — don't assume offline or we miss go-lives. Confirm with checkLive
        // when the batch looks incomplete, or when they were already live.
        const bulkLooksPartial = results.length < chunk.length;
        if (bulkLooksPartial || existing?.isLive) {
          row = (await resolveDefinitive(member.uniqueId)) ?? {
            uniqueId: member.uniqueId,
            isLive: false,
            unknown: false,
            roomId: null,
            title: null,
            viewerCount: null,
          };
        } else {
          // Full batch returned and this handle simply wasn't listed → offline.
          row = {
            uniqueId: member.uniqueId,
            isLive: false,
            unknown: false,
            roomId: null,
            title: null,
            viewerCount: null,
          };
        }
      } else if (row.unknown) {
        // unknown must not block go-live: always resolve with checkLive.
        const definitive = await resolveDefinitive(member.uniqueId);
        if (!definitive) {
          unknown++;
          if (existing?.isLive) {
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
          }
          continue;
        }
        row = definitive;
      }

      if (!row) continue;

      await applyLiveStatus(member.userId, member.uniqueId, {
        isLive: row.isLive,
        roomId: row.roomId,
        title: row.title,
        viewerCount: row.viewerCount,
      });

      if (!existing || existing.isLive !== row.isLive) updated++;
    }
  }

  // Anyone still marked live who wasn't in this roster pass → clear
  const stuckLive = await prisma.tikTokStatsSnapshot.findMany({
    where: {
      isLive: true,
      userId: { notIn: Array.from(checkedUserIds) },
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

/**
 * If the roster hasn't been polled recently, sync now so /live stays accurate
 * even when GitHub Actions cron is delayed or dropped.
 */
export async function refreshLiveRosterIfStale(): Promise<{
  refreshed: boolean;
  liveCheckedAt: Date | null;
}> {
  if (!isTikToolsConfigured()) {
    return { refreshed: false, liveCheckedAt: null };
  }

  const latest = await prisma.tikTokStatsSnapshot.findFirst({
    orderBy: { liveCheckedAt: "desc" },
    select: { liveCheckedAt: true },
  });
  const ageMs = latest?.liveCheckedAt
    ? Date.now() - latest.liveCheckedAt.getTime()
    : Number.POSITIVE_INFINITY;

  if (ageMs < LIVE_PAGE_REFRESH_MS) {
    return { refreshed: false, liveCheckedAt: latest?.liveCheckedAt ?? null };
  }

  try {
    await syncRosterLiveStatus();
    const after = await prisma.tikTokStatsSnapshot.findFirst({
      orderBy: { liveCheckedAt: "desc" },
      select: { liveCheckedAt: true },
    });
    return { refreshed: true, liveCheckedAt: after?.liveCheckedAt ?? null };
  } catch (err) {
    console.error("refreshLiveRosterIfStale failed:", err);
    return { refreshed: false, liveCheckedAt: latest?.liveCheckedAt ?? null };
  }
}

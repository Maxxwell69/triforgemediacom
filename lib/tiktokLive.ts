import { prisma } from "@/lib/prisma";
import { bulkCheckLive, isTikToolsConfigured, parseTikTokUniqueId } from "@/lib/tiktools";
import { ensureTikTokSocialLink } from "@/lib/tiktokStats";

export const LIVE_TAG_NAME = "LIVE";
export const LIVE_TAG_COLOR = "#FD4802";

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

  for (let i = 0; i < roster.length; i += BULK_CHUNK) {
    const chunk = roster.slice(i, i + BULK_CHUNK);
    const results = await bulkCheckLive(chunk.map((r) => r.uniqueId));
    const byId = new Map(results.map((r) => [r.uniqueId, r]));

    for (const member of chunk) {
      const row = byId.get(member.uniqueId);
      if (!row) continue;

      if (row.unknown) {
        unknown++;
        continue;
      }

      const now = new Date();
      const existing = await prisma.tikTokStatsSnapshot.findUnique({
        where: { userId: member.userId },
        select: { isLive: true },
      });

      await prisma.tikTokStatsSnapshot.upsert({
        where: { userId: member.userId },
        create: {
          userId: member.userId,
          uniqueId: member.uniqueId,
          isLive: row.isLive,
          roomId: row.roomId,
          liveTitle: row.title,
          liveViewerCount: row.viewerCount,
          liveCheckedAt: now,
        },
        update: {
          uniqueId: member.uniqueId,
          isLive: row.isLive,
          roomId: row.roomId,
          liveTitle: row.title,
          liveViewerCount: row.viewerCount,
          liveCheckedAt: now,
        },
      });

      await syncLiveTagForUser(member.userId, row.isLive);

      if (row.isLive) live++;
      if (!existing || existing.isLive !== row.isLive) updated++;
    }
  }

  // Clear LIVE tags for anyone no longer in the live snapshot set
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

  return {
    backfilled: filled,
    checked: roster.length,
    live,
    updated,
    unknown,
  };
}

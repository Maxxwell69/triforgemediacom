import { prisma } from "@/lib/prisma";

/** Ensure every listed channel has a read cursor (defaults to now → no backlog spam). */
export async function ensureChannelReads(userId: string, channelIds: string[]) {
  if (channelIds.length === 0) return;
  const existing = await prisma.channelRead.findMany({
    where: { userId, channelId: { in: channelIds } },
    select: { channelId: true },
  });
  const have = new Set(existing.map((r) => r.channelId));
  const missing = channelIds.filter((id) => !have.has(id));
  if (missing.length === 0) return;
  await prisma.channelRead.createMany({
    data: missing.map((channelId) => ({
      userId,
      channelId,
      lastReadAt: new Date(),
    })),
    skipDuplicates: true,
  });
}

export async function markChannelRead(userId: string, channelId: string, at = new Date()) {
  await prisma.channelRead.upsert({
    where: { userId_channelId: { userId, channelId } },
    create: { userId, channelId, lastReadAt: at },
    update: { lastReadAt: at },
  });
}

/** Unread counts per channel (messages from others after lastReadAt). */
export async function getChannelUnreadCounts(
  userId: string,
  channelIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const id of channelIds) counts[id] = 0;
  if (channelIds.length === 0) return counts;

  await ensureChannelReads(userId, channelIds);

  const reads = await prisma.channelRead.findMany({
    where: { userId, channelId: { in: channelIds } },
    select: { channelId: true, lastReadAt: true },
  });

  await Promise.all(
    reads.map(async (read) => {
      const n = await prisma.message.count({
        where: {
          channelId: read.channelId,
          userId: { not: userId },
          createdAt: { gt: read.lastReadAt },
        },
      });
      counts[read.channelId] = n;
    })
  );

  return counts;
}

/** Roll channel unreads up to group badges (ungrouped → Home). */
export function aggregateUnreadByGroup(
  channels: { id: string; groups: { id: string }[] }[],
  unreadCounts: Record<string, number>,
  homeGroupId: string | null
): Record<string, number> {
  const byGroup: Record<string, number> = {};
  for (const ch of channels) {
    const count = unreadCounts[ch.id] ?? 0;
    if (count <= 0) continue;
    if (ch.groups.length === 0) {
      if (homeGroupId) {
        byGroup[homeGroupId] = (byGroup[homeGroupId] ?? 0) + count;
      }
      continue;
    }
    for (const g of ch.groups) {
      byGroup[g.id] = (byGroup[g.id] ?? 0) + count;
    }
  }
  return byGroup;
}

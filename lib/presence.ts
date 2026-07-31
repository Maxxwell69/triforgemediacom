import { prisma } from "@/lib/prisma";

/** Consider someone online if their heartbeat landed within this window. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function isOnline(lastSeenAt: Date | string | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false;
  const t = typeof lastSeenAt === "string" ? new Date(lastSeenAt).getTime() : lastSeenAt.getTime();
  if (Number.isNaN(t)) return false;
  return now - t < ONLINE_WINDOW_MS;
}

/** Touch presence for the signed-in user (page load + client heartbeat). */
export async function touchPresence(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });
}

export async function getOnlineUserIds(userIds: string[]): Promise<Set<string>> {
  const online = new Set<string>();
  if (userIds.length === 0) return online;
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await prisma.user.findMany({
    where: { id: { in: userIds }, lastSeenAt: { gte: since } },
    select: { id: true },
  });
  for (const row of rows) online.add(row.id);
  return online;
}

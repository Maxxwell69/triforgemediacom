import { prisma } from "@/lib/prisma";

/** Ensure a read cursor exists (defaults to now → no backlog of old tickets). */
export async function ensureBugReportRead(userId: string) {
  await prisma.bugReportRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: new Date() },
    update: {},
  });
}

export async function markBugReportsRead(userId: string, at = new Date()) {
  await prisma.bugReportRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: at },
    update: { lastReadAt: at },
  });
}

/** Count of Hub Bug tickets filed by others after this user's last visit. */
export async function getBugReportUnreadCount(userId: string): Promise<number> {
  await ensureBugReportRead(userId);
  const read = await prisma.bugReportRead.findUnique({
    where: { userId },
    select: { lastReadAt: true },
  });
  if (!read) return 0;

  return prisma.bugReport.count({
    where: {
      reporterId: { not: userId },
      createdAt: { gt: read.lastReadAt },
    },
  });
}

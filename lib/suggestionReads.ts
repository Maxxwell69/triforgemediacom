import { prisma } from "@/lib/prisma";

export async function markSuggestionsRead(userId: string, at = new Date()) {
  await prisma.suggestionRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: at },
    update: { lastReadAt: at },
  });
}

/** New suggestions from others since this user last opened the board. */
export async function getSuggestionUnreadCount(userId: string): Promise<number> {
  await prisma.suggestionRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: new Date() },
    update: {},
  });
  const read = await prisma.suggestionRead.findUnique({
    where: { userId },
    select: { lastReadAt: true },
  });
  if (!read) return 0;

  return prisma.suggestion.count({
    where: {
      authorId: { not: userId },
      createdAt: { gt: read.lastReadAt },
    },
  });
}

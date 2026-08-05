import { prisma } from "@/lib/prisma";
import { isLegacyBugChannelName } from "@/lib/bugs";

export type ImportBugChannelResult = {
  channelName: string | null;
  scanned: number;
  imported: number;
  skipped: number;
};

function titleFromContent(content: string): string {
  const firstLine = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  const raw = (firstLine || content).replace(/\s+/g, " ").trim();
  if (raw.length <= 120) return raw || "Imported bug";
  return `${raw.slice(0, 117).trimEnd()}...`;
}

/**
 * Copy legacy #bugs chat messages into Hub Bug reports (idempotent via sourceMessageId).
 */
export async function importBugChannelMessages(): Promise<ImportBugChannelResult> {
  const channels = await prisma.channel.findMany({
    select: { id: true, name: true },
  });
  const channel = channels.find((c) => isLegacyBugChannelName(c.name));
  if (!channel) {
    return { channelName: null, scanned: 0, imported: 0, skipped: 0 };
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true, content: true, createdAt: true },
  });

  let imported = 0;
  let skipped = 0;

  for (const message of messages) {
    const content = message.content.trim();
    if (!content) {
      skipped++;
      continue;
    }

    const existing = await prisma.bugReport.findUnique({
      where: { sourceMessageId: message.id },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.bugReport.create({
      data: {
        title: titleFromContent(content),
        description: content,
        status: "REPORTED",
        platform: "WEBSITE",
        reportedAt: message.createdAt,
        reporterId: message.userId,
        sourceMessageId: message.id,
        adminNotes: `Imported from #${channel.name} chat`,
      },
    });
    imported++;
  }

  return {
    channelName: channel.name,
    scanned: messages.length,
    imported,
    skipped,
  };
}

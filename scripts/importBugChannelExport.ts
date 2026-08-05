/**
 * Import scripts/bug-channel-export.json into the current DATABASE_URL as Hub Bug reports.
 * Matches reporters by userId first, then by email.
 *
 *   npx tsx scripts/importBugChannelExport.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExportFile = {
  channelName: string;
  messages: Array<{
    id: string;
    userId: string;
    email: string;
    name: string | null;
    content: string;
    createdAt: string;
  }>;
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

async function main() {
  const path = resolve("scripts/bug-channel-export.json");
  const data = JSON.parse(readFileSync(path, "utf8")) as ExportFile;

  let imported = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const message of data.messages) {
    const content = message.content.trim();
    if (!content) {
      skipped++;
      continue;
    }

    const already = await prisma.bugReport.findUnique({
      where: { sourceMessageId: message.id },
      select: { id: true },
    });
    if (already) {
      skipped++;
      continue;
    }

    let reporterId = (
      await prisma.user.findUnique({ where: { id: message.userId }, select: { id: true } })
    )?.id;

    if (!reporterId && message.email) {
      reporterId = (
        await prisma.user.findUnique({ where: { email: message.email }, select: { id: true } })
      )?.id;
    }

    if (!reporterId) {
      console.warn(`No matching user for message ${message.id} (${message.email}) — skipped`);
      unmatched++;
      continue;
    }

    await prisma.bugReport.create({
      data: {
        title: titleFromContent(content),
        description: content,
        status: "REPORTED",
        platform: "WEBSITE",
        reportedAt: new Date(message.createdAt),
        reporterId,
        sourceMessageId: message.id,
        adminNotes: `Imported from #${data.channelName} chat`,
      },
    });
    imported++;
  }

  console.log(
    `Done. imported=${imported} skipped=${skipped} unmatchedUsers=${unmatched} total=${data.messages.length}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Export legacy #bugs chat messages to JSON (read-only).
 *
 * Point SOURCE_DATABASE_URL at production (or any DB that has #bugs), then:
 *   npx tsx scripts/exportBugChannel.ts
 *
 * Writes scripts/bug-channel-export.json
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
if (!sourceUrl) {
  console.error("Set SOURCE_DATABASE_URL (or DATABASE_URL).");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: sourceUrl } } });

function isBugChannel(name: string) {
  const n = name.trim().toLowerCase().replace(/^#/, "");
  return n === "bugs" || n === "bug" || n === "bug-reports" || n === "bugreports" || n.includes("bug");
}

async function main() {
  const channels = await prisma.channel.findMany({ select: { id: true, name: true } });
  const channel = channels.find((c) => isBugChannel(c.name));
  if (!channel) {
    console.error("No bug-like channel found. Channels:", channels.map((c) => c.name).join(", "));
    process.exit(1);
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      content: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  const outPath = resolve("scripts/bug-channel-export.json");
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        channelName: channel.name,
        messages: messages.map((m) => ({
          id: m.id,
          userId: m.userId,
          email: m.user.email,
          name: m.user.name,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      },
      null,
      2
    )
  );

  console.log(`Exported ${messages.length} messages from #${channel.name} → ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

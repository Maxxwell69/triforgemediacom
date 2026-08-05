/**
 * Read-only: list legacy #bugs channels and message counts.
 * Usage: npx tsx scripts/listBugChannel.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { messages: true } } },
  });
  console.log("Channels:");
  for (const c of channels) {
    console.log(`  #${c.name} (${c.id}) — ${c._count.messages} messages`);
  }

  const bugish = channels.filter((c) => {
    const n = c.name.trim().toLowerCase().replace(/^#/, "");
    return n === "bugs" || n === "bug" || n === "bug-reports" || n === "bugreports" || n.includes("bug");
  });

  if (bugish.length === 0) {
    console.log("\nNo bug-like channels found.");
    return;
  }

  for (const ch of bugish) {
    const messages = await prisma.message.findMany({
      where: { channelId: ch.id },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    console.log(`\n--- #${ch.name} (${messages.length} messages) ---`);
    for (const m of messages) {
      const preview = m.content.replace(/\s+/g, " ").slice(0, 120);
      console.log(
        `[${m.createdAt.toISOString()}] ${m.user.name || m.user.email}: ${preview}`
      );
    }
  }

  const reports = await prisma.bugReport.count().catch(() => -1);
  console.log(`\nExisting BugReport rows: ${reports}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

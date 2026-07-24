import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@triforgemedia.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme123!";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email,
      name: "TriForge Admin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log(`(Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars to customize.)`);

  const defaultChannels: { name: string; description: string; minRole: "MEMBER" | "CREATOR" | "MOD" | "ADMIN" }[] = [
    { name: "general", description: "General community chat", minRole: "MEMBER" },
    { name: "wins", description: "Share your wins, big or small", minRole: "MEMBER" },
    { name: "creator-lounge", description: "Creators-only discussion", minRole: "CREATOR" },
    { name: "mod-team", description: "Mod/admin coordination", minRole: "MOD" },
  ];

  for (const ch of defaultChannels) {
    const existing = await prisma.channel.findFirst({ where: { name: ch.name } });
    if (!existing) {
      await prisma.channel.create({ data: ch });
      console.log(`Created channel #${ch.name}`);
    }
  }

  const defaultTaskTemplates: {
    platform: "TIKTOK" | "TWITCH" | "YOUTUBE" | "KICK" | "INSTAGRAM" | "OTHER" | null;
    goalKey: string | null;
    taskText: string;
    xpValue: number;
  }[] = [
    { platform: null, goalKey: null, taskText: "Post in #general and introduce your progress today", xpValue: 5 },
    { platform: "TIKTOK", goalKey: null, taskText: "Post one TikTok video today", xpValue: 15 },
    { platform: "TWITCH", goalKey: null, taskText: "Go live for at least 1 hour today", xpValue: 20 },
    { platform: "YOUTUBE", goalKey: null, taskText: "Upload or schedule a YouTube video/short", xpValue: 15 },
    { platform: null, goalKey: "growFollowers", taskText: "Engage with 10 comments from your community", xpValue: 10 },
    { platform: null, goalKey: "consistentSchedule", taskText: "Plan tomorrow's content in advance", xpValue: 10 },
    { platform: null, goalKey: "increaseEngagement", taskText: "Reply to every comment on your latest post", xpValue: 10 },
    { platform: null, goalKey: "monetization", taskText: "Research or reach out to one potential brand partner", xpValue: 15 },
  ];

  for (const t of defaultTaskTemplates) {
    const existing = await prisma.taskTemplate.findFirst({
      where: { taskText: t.taskText },
    });
    if (!existing) {
      await prisma.taskTemplate.create({ data: t });
      console.log(`Created task template: ${t.taskText}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

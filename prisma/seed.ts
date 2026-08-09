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

  const defaultTags: { name: string; color: string; selfAssignable: boolean }[] = [
    { name: "CN", color: "#FD4802", selfAssignable: false },
    { name: "LIVE", color: "#FD4802", selfAssignable: false },
    { name: "Live Host", color: "#00D4FF", selfAssignable: true },
    { name: "Music Maker", color: "#A855F7", selfAssignable: true },
    { name: "Shop Owner", color: "#22C55E", selfAssignable: true },
    { name: "Battle", color: "#EF4444", selfAssignable: true },
    { name: "Engagement Host", color: "#EAB308", selfAssignable: true },
    { name: "Gamer", color: "#3B82F6", selfAssignable: true },
  ];

  for (const t of defaultTags) {
    await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }
  console.log(`Seeded ${defaultTags.length} tags`);

  // MN (Media Network — agency-represented creators) / CN (Creator Network)
  // routing: see lib/mnCn.ts. MN Group+Tag are also upserted on demand the
  // first time someone applies, but we create them here too so they're
  // visible in admin immediately on a fresh environment.
  await prisma.group.upsert({
    where: { name: "MN" },
    update: { showInList: false },
    create: {
      name: "MN",
      description: "Creators represented by an outside agency for live hosting.",
      color: "#00D4FF",
      grantsTikTaskAccess: true,
      showInList: false,
    },
  });
  await prisma.tag.upsert({
    where: { name: "MN" },
    update: {},
    create: {
      name: "MN",
      description: "Represented by an outside agency for live hosting.",
      color: "#00D4FF",
      selfAssignable: false,
    },
  });
  const cnGroup = await prisma.group.upsert({
    where: { name: "CN" },
    update: { showInList: false },
    create: {
      name: "CN",
      description: "Official TriForge Creator Network members.",
      color: "#FD4802",
      grantsTikTaskAccess: true,
      showInList: false,
    },
  });
  const existingCnChannel = await prisma.channel.findFirst({ where: { name: "creator-network" } });
  const cnChannel =
    existingCnChannel ??
    (await prisma.channel.create({
      data: {
        name: "creator-network",
        description: "Official Creator Network members only.",
        minRole: "MOD",
      },
    }));
  await prisma.group.update({
    where: { id: cnGroup.id },
    data: { channels: { connect: { id: cnChannel.id } } },
  });
  const existingCnCourse = await prisma.course.findFirst({
    where: { title: "Joining the Creator Network" },
  });
  if (!existingCnCourse) {
    await prisma.course.create({
      data: {
        title: "Joining the Creator Network",
        description:
          "What the Creator Network is, what we look for, and how to apply once you're active.",
        category: "Creator Network",
        isPublished: true,
        order: 0,
        xpReward: 0,
        lessons: {
          create: [
            {
              title: "What is the Creator Network?",
              order: 0,
              content:
                "<p>Placeholder content — replace this in the admin Courses editor with the real overview of the Creator Network (CN) program, requirements, and application steps.</p>",
            },
          ],
        },
      },
    });
  }
  console.log("Seeded MN/CN groups, channel, and placeholder course");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

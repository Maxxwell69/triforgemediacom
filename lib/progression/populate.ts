import { prisma } from "@/lib/prisma";
import { SPECIALTY_TRACKS, SPECIALTY_TRACK_NAMES, specializeMissionName } from "@/lib/progression/tracks";

const TRACKS = SPECIALTY_TRACK_NAMES;

const CATEGORIES: { name: string; description: string; unlockAt?: string }[] = [
  { name: "Go Live", description: "Streaming consistency, scheduled stream times" },
  { name: "Engagement", description: "Chat interaction, polls, shoutouts" },
  { name: "Growth", description: "Follower/subscriber milestones, audience acquisition" },
  { name: "Content Creation", description: "Clips, VODs, posts, repurposed content" },
  { name: "Collab", description: "Co-streaming, raids/hosts, joint events", unlockAt: "Regular" },
  { name: "Monetization", description: "Gifts received, shop sales, sponsor reads", unlockAt: "Regular" },
  {
    name: "Skill Mastery",
    description: "Specialization-track tasks. Pick a track at Rising Star, then complete that track’s deep-dive.",
  },
  {
    name: "Community Building",
    description: "Discord activity, fan club engagement, community events",
    unlockAt: "Regular",
  },
];

const LEVELS: {
  name: string;
  xpRequired: number;
  description: string;
  milestoneMode?: "ALL" | "ANY";
  milestones?: string[];
  certs?: { category: string; tier: string }[];
}[] = [
  {
    name: "Recruit",
    xpRequired: 0,
    description: "Account created and hub onboarding complete. Shared Live Host stage starts here.",
  },
  {
    name: "Newcomer",
    xpRequired: 500,
    description: "First consistency checkpoint. Earn Go Live and Engagement Trainee to continue.",
    certs: [
      { category: "Go Live", tier: "Trainee" },
      { category: "Engagement", tier: "Trainee" },
    ],
  },
  {
    name: "Rising Star",
    xpRequired: 1500,
    description: "Specialization unlocked. Growth and Content Creation Trainee required — then pick one of the seven tracks.",
    certs: [
      { category: "Growth", tier: "Trainee" },
      { category: "Content Creation", tier: "Trainee" },
    ],
  },
  {
    name: "Regular",
    xpRequired: 3000,
    description: "Set up one core streaming tool and earn Skill Mastery Trainee on your chosen track. All eight categories open here.",
    milestones: ["Set up one core streaming tool"],
    certs: [{ category: "Skill Mastery", tier: "Trainee" }],
  },
  {
    name: "Fan Favorite",
    xpRequired: 5500,
    description: "Go Live and Engagement Certified.",
    certs: [
      { category: "Go Live", tier: "Certified" },
      { category: "Engagement", tier: "Certified" },
    ],
  },
  {
    name: "Featured Creator",
    xpRequired: 9000,
    description: "Launch a personal hub or website and earn Skill Mastery Certified.",
    milestones: ["Launch a personal hub/website"],
    certs: [{ category: "Skill Mastery", tier: "Certified" }],
  },
  {
    name: "Top Creator",
    xpRequired: 14000,
    description: "Complete one lifetime collab and earn Collab Trainee.",
    milestones: ["Complete a lifetime collab"],
    certs: [{ category: "Collab", tier: "Trainee" }],
  },
  {
    name: "Elite Creator",
    xpRequired: 21000,
    description: "Monetization Trainee and Growth Certified.",
    certs: [
      { category: "Monetization", tier: "Trainee" },
      { category: "Growth", tier: "Certified" },
    ],
  },
  {
    name: "Triforge Star",
    xpRequired: 30000,
    description: "Formalize as a business (LLC/DBA, contracts, or a sponsor deal on file).",
    milestones: ["Formalize as a business"],
    certs: [
      { category: "Monetization", tier: "Certified" },
      { category: "Community Building", tier: "Certified" },
    ],
  },
  {
    name: "Legend",
    xpRequired: 42000,
    description: "Full toolkit in use — hub, business entity, and an active shop or sponsor pipeline. Skill Mastery Master plus Certified in every other category.",
    milestones: ["Run the full creator toolkit"],
    certs: [
      { category: "Skill Mastery", tier: "Master" },
      { category: "Go Live", tier: "Certified" },
      { category: "Engagement", tier: "Certified" },
      { category: "Growth", tier: "Certified" },
      { category: "Content Creation", tier: "Certified" },
      { category: "Collab", tier: "Certified" },
      { category: "Monetization", tier: "Certified" },
      { category: "Community Building", tier: "Certified" },
    ],
  },
];

const CERT_XP: Record<string, number> = {
  "Go Live": 2000,
  Engagement: 2000,
  Growth: 2500,
  "Content Creation": 2500,
  Collab: 3000,
  Monetization: 3500,
  "Skill Mastery": 4000,
  "Community Building": 3000,
};

const MILESTONE_MISSIONS: { name: string; category: string; xpValue: number; description: string }[] = [
  {
    name: "Set up one core streaming tool",
    category: "Go Live",
    xpValue: 75,
    description: "Get one core tool live — stream deck, overlay, scheduler, or equivalent.",
  },
  {
    name: "Launch a personal hub/website",
    category: "Community Building",
    xpValue: 150,
    description: "Publish a personal hub or website your audience can find.",
  },
  {
    name: "Complete a lifetime collab",
    category: "Collab",
    xpValue: 200,
    description: "Finish one real collab — co-stream, raid/host chain, or joint event.",
  },
  {
    name: "Formalize as a business",
    category: "Monetization",
    xpValue: 250,
    description: "LLC/DBA, contracts, or a sponsor deal on file.",
  },
  {
    name: "Run the full creator toolkit",
    category: "Community Building",
    xpValue: 300,
    description: "Hub + business entity + an active shop or sponsor pipeline.",
  },
];

async function upsertCategory(name: string, description: string, sortOrder: number) {
  const existing = await prisma.progressionCategory.findFirst({ where: { name } });
  if (existing) {
    return prisma.progressionCategory.update({
      where: { id: existing.id },
      data: { description, sortOrder, status: "ACTIVE" },
    });
  }
  return prisma.progressionCategory.create({
    data: { name, description, sortOrder, status: "ACTIVE" },
  });
}

async function upsertLevel(
  name: string,
  description: string,
  sortOrder: number,
  xpRequired: number,
  milestoneMode: "ALL" | "ANY"
) {
  const existing = await prisma.progressionLevel.findFirst({ where: { name } });
  if (existing) {
    return prisma.progressionLevel.update({
      where: { id: existing.id },
      data: { description, sortOrder, xpRequired, milestoneMode, status: "ACTIVE" },
    });
  }
  return prisma.progressionLevel.create({
    data: { name, description, sortOrder, xpRequired, milestoneMode, status: "ACTIVE" },
  });
}

async function upsertMission(
  categoryId: string,
  name: string,
  description: string,
  xpValue: number,
  sortOrder: number
) {
  const existing = await prisma.progressionMission.findFirst({ where: { name, categoryId } });
  if (existing) {
    return prisma.progressionMission.update({
      where: { id: existing.id },
      data: { description, xpValue, sortOrder, status: "ACTIVE", recurrence: "ONE_TIME" },
    });
  }
  return prisma.progressionMission.create({
    data: {
      categoryId,
      name,
      description,
      xpValue,
      sortOrder,
      status: "ACTIVE",
      recurrence: "ONE_TIME",
    },
  });
}

async function upsertCertification(categoryId: string, name: string, certifiedXp: number, sortOrder: number) {
  const existing = await prisma.progressionCertification.findFirst({ where: { name } });
  const cert = existing
    ? await prisma.progressionCertification.update({
        where: { id: existing.id },
        data: { categoryId, sortOrder, status: "ACTIVE", description: `${name} track: Trainee / Certified / Master.` },
      })
    : await prisma.progressionCertification.create({
        data: {
          categoryId,
          name,
          sortOrder,
          status: "ACTIVE",
          description: `${name} track: Trainee / Certified / Master.`,
        },
      });

  const tiers = [
    { name: "Trainee", sortOrder: 0, unlockKind: "QUIZ_PASSED" as const, xpRequired: null as number | null },
    { name: "Certified", sortOrder: 1, unlockKind: "CATEGORY_XP" as const, xpRequired: certifiedXp },
    { name: "Master", sortOrder: 2, unlockKind: "ADMIN_REVIEW" as const, xpRequired: null },
  ];
  for (const tier of tiers) {
    const found = await prisma.progressionCertTier.findFirst({
      where: { certificationId: cert.id, name: tier.name },
    });
    if (found) {
      await prisma.progressionCertTier.update({
        where: { id: found.id },
        data: { sortOrder: tier.sortOrder, unlockKind: tier.unlockKind, xpRequired: tier.xpRequired },
      });
    } else {
      await prisma.progressionCertTier.create({
        data: { certificationId: cert.id, ...tier },
      });
    }
  }
  return prisma.progressionCertification.findUniqueOrThrow({
    where: { id: cert.id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });
}

async function upsertBadge(
  name: string,
  description: string,
  trigger: "LEVEL" | "MISSION" | "CERTIFICATION" | "SKILL" | "STANDALONE",
  triggerId: string | null
) {
  const existing = await prisma.progressionBadge.findFirst({ where: { name } });
  if (existing) {
    return prisma.progressionBadge.update({
      where: { id: existing.id },
      data: { description, trigger, triggerId, status: "ACTIVE" },
    });
  }
  return prisma.progressionBadge.create({
    data: { name, description, trigger, triggerId, status: "ACTIVE" },
  });
}

export async function populateOfficialProgression() {
  const categoryByName = new Map<string, { id: string }>();
  for (let index = 0; index < CATEGORIES.length; index += 1) {
    const category = CATEGORIES[index];
    categoryByName.set(category.name, await upsertCategory(category.name, category.description, index));
  }

  const levelByName = new Map<string, { id: string }>();
  for (let index = 0; index < LEVELS.length; index += 1) {
    const level = LEVELS[index];
    levelByName.set(
      level.name,
      await upsertLevel(level.name, level.description, index, level.xpRequired, level.milestoneMode ?? "ALL")
    );
  }

  for (const category of CATEGORIES) {
    const row = categoryByName.get(category.name);
    if (!row) continue;
    await prisma.progressionCategory.update({
      where: { id: row.id },
      data: { unlockAtLevelId: category.unlockAt ? levelByName.get(category.unlockAt)?.id ?? null : null },
    });
  }

  const skillMasteryId = categoryByName.get("Skill Mastery")!.id;
  const missionByName = new Map<string, { id: string }>();
  for (let index = 0; index < TRACKS.length; index += 1) {
    const track = TRACKS[index];
    const name = specializeMissionName(track);
    missionByName.set(
      name,
      await upsertMission(
        skillMasteryId,
        name,
        `Choose the ${track} specialization. Unlocks at Rising Star. One pick carries through Regular → Legend.`,
        50,
        index
      )
    );
  }
  for (let index = 0; index < MILESTONE_MISSIONS.length; index += 1) {
    const mission = MILESTONE_MISSIONS[index];
    missionByName.set(
      mission.name,
      await upsertMission(
        categoryByName.get(mission.category)!.id,
        mission.name,
        mission.description,
        mission.xpValue,
        20 + index
      )
    );
  }

  await prisma.progressionLearningModule.updateMany({
    data: { status: "ARCHIVED" },
  });

  const certByCategory = new Map<string, { id: string; tiers: { id: string; name: string }[] }>();
  for (let index = 0; index < CATEGORIES.length; index += 1) {
    const category = CATEGORIES[index];
    const cert = await upsertCertification(
      categoryByName.get(category.name)!.id,
      category.name,
      CERT_XP[category.name] ?? 2000,
      index
    );
    certByCategory.set(category.name, cert);
  }

  for (const level of LEVELS) {
    const levelId = levelByName.get(level.name)!.id;
    await prisma.progressionLevelMilestone.deleteMany({ where: { levelId } });
    await prisma.progressionLevelCertReq.deleteMany({ where: { levelId } });
    for (const missionName of level.milestones ?? []) {
      const mission = missionByName.get(missionName);
      if (!mission) continue;
      await prisma.progressionLevelMilestone.create({
        data: { levelId, missionId: mission.id },
      });
    }
    for (const req of level.certs ?? []) {
      const cert = certByCategory.get(req.category);
      const tier = cert?.tiers.find((item) => item.name === req.tier);
      if (!cert || !tier) continue;
      await prisma.progressionLevelCertReq.create({
        data: { levelId, certificationId: cert.id, tierId: tier.id },
      });
    }
  }

  for (const level of LEVELS) {
    await upsertBadge(level.name, `Reached ${level.name}.`, "LEVEL", levelByName.get(level.name)!.id);
  }
  const certNames = Array.from(certByCategory.keys());
  for (let i = 0; i < certNames.length; i += 1) {
    const categoryName = certNames[i];
    const cert = certByCategory.get(categoryName);
    if (!cert) continue;
    for (let t = 0; t < cert.tiers.length; t += 1) {
      const tier = cert.tiers[t];
      await upsertBadge(
        `${categoryName} — ${tier.name}`,
        `Earned ${categoryName} ${tier.name}.`,
        "CERTIFICATION",
        tier.id
      );
    }
  }
  for (const track of TRACKS) {
    await upsertBadge(track, `Chose the ${track} specialization.`, "MISSION", missionByName.get(specializeMissionName(track))!.id);
  }
  await upsertBadge(
    "First Collab",
    "Completed one lifetime collab.",
    "MISSION",
    missionByName.get("Complete a lifetime collab")!.id
  );
  await upsertBadge(
    "Business Owner",
    "Formalized as a business.",
    "MISSION",
    missionByName.get("Formalize as a business")!.id
  );

  await prisma.progressionSkill.updateMany({
    where: { name: { in: ["Early Adopter", "Multi-Track", "Community Pillar"] } },
    data: { status: "ARCHIVED" },
  });
  const skillMastery = categoryByName.get("Skill Mastery");
  const risingStar = levelByName.get("Rising Star");
  const skills = SPECIALTY_TRACKS.map((track) => ({
    name: track.name,
    description: `${track.description} Unlocks when you choose this specialty at Rising Star.`,
    unlockKind: "MANUAL" as const,
    categoryId: skillMastery?.id,
    levelId: risingStar?.id,
  }));
  for (let index = 0; index < skills.length; index += 1) {
    const skill = skills[index];
    const existing = await prisma.progressionSkill.findFirst({ where: { name: skill.name } });
    const data = {
      description: skill.description,
      sortOrder: index,
      status: "ACTIVE" as const,
      unlockKind: skill.unlockKind,
      certificationId: null,
      certTierId: null,
      categoryId: skill.categoryId ?? null,
      levelId: skill.levelId ?? null,
    };
    if (existing) {
      await prisma.progressionSkill.update({ where: { id: existing.id }, data });
    } else {
      await prisma.progressionSkill.create({ data: { name: skill.name, ...data } });
    }
  }

  return {
    categories: CATEGORIES.length,
    levels: LEVELS.length,
    modules: 0,
    tracks: TRACKS.length,
  };
}

/** Always keep the seven specialty skills live and archive the old extras. */
export async function syncSpecialtySkills() {
  await prisma.progressionSkill.updateMany({
    where: { name: { in: ["Early Adopter", "Multi-Track", "Community Pillar"] } },
    data: { status: "ARCHIVED" },
  });
  const skillMastery = await prisma.progressionCategory.findFirst({ where: { name: "Skill Mastery" } });
  const risingStar = await prisma.progressionLevel.findFirst({ where: { name: "Rising Star" } });
  for (let index = 0; index < SPECIALTY_TRACKS.length; index += 1) {
    const track = SPECIALTY_TRACKS[index];
    const existing = await prisma.progressionSkill.findFirst({ where: { name: track.name } });
    const data = {
      description: `${track.description} Unlocks when you choose this specialty at Rising Star.`,
      sortOrder: index,
      status: "ACTIVE" as const,
      unlockKind: "MANUAL" as const,
      certificationId: null,
      certTierId: null,
      categoryId: skillMastery?.id ?? null,
      levelId: risingStar?.id ?? null,
    };
    if (existing) {
      await prisma.progressionSkill.update({ where: { id: existing.id }, data });
    } else {
      await prisma.progressionSkill.create({ data: { name: track.name, ...data } });
    }
  }
}

/** Seeds or realigns the official ladder (specialty pick is at Rising Star, not a Rising Star gate). */
export async function ensureOfficialProgression() {
  const existing = await prisma.progressionMission.findFirst({
    where: { name: { startsWith: "Specialize: " }, status: "ACTIVE" },
    select: { id: true },
  });
  const rising = await prisma.progressionLevel.findFirst({
    where: { name: "Rising Star" },
    include: { milestones: { include: { mission: { select: { name: true } } } } },
  });
  const risingHasPick = rising?.milestones.some((row) => row.mission.name.startsWith("Specialize: "));
  if (!existing || risingHasPick) {
    await populateOfficialProgression();
  }
  await syncSpecialtySkills();
}

import "server-only";

import { ensureTenantMemberTypeSchema, getTenantPrisma } from "@/lib/hub/tenantPrisma";

const DEFAULT_CHANNELS: { name: string; description: string; minRole: "FAN" | "MEMBER" | "CREATOR" | "MOD" }[] =
  [
    { name: "fans", description: "Open chat for fans and superfans", minRole: "FAN" },
    { name: "general", description: "General community chat", minRole: "MEMBER" },
    { name: "wins", description: "Share your wins, big or small", minRole: "MEMBER" },
    { name: "creator-lounge", description: "Creators-only discussion", minRole: "CREATOR" },
    { name: "mod-team", description: "Mod/admin coordination", minRole: "MOD" },
  ];

/** Idempotent starter data so a new hub isn’t an empty shell after provision. */
export async function seedTenantDefaults(schema: string) {
  await ensureTenantMemberTypeSchema(schema);
  const db = getTenantPrisma(schema);
  const typeDefaults = [
    { key: "fan", name: "Fan", sortOrder: 0, signupDefault: true },
    { key: "superfan", name: "Superfan", sortOrder: 1, signupDefault: false },
    { key: "member", name: "Member", sortOrder: 2, signupDefault: false },
  ] as const;
  for (const def of typeDefaults) {
    const existing = await db.hubMemberType.findUnique({ where: { key: def.key } });
    if (existing) continue;
    await db.hubMemberType.create({
      data: {
        key: def.key,
        name: def.name,
        sortOrder: def.sortOrder,
        signupDefault: def.signupDefault,
        allowedMenuIds: [],
      },
    });
  }
  const home =
    (await db.group.findFirst({ where: { isHome: true } })) ??
    (await db.group.upsert({
      where: { id: "home_group_system" },
      update: { isHome: true },
      create: {
        id: "home_group_system",
        name: "Home",
        description: "Main hub space — default community channels live here.",
        color: "#FD4802",
        grantsTikTaskAccess: true,
        canCreateEvents: true,
        isHome: true,
        joinMode: "CLOSED",
      },
    }));

  for (const ch of DEFAULT_CHANNELS) {
    const existing = await db.channel.findFirst({ where: { name: ch.name } });
    if (existing) {
      await db.channel.update({
        where: { id: existing.id },
        data: { groups: { connect: { id: home.id } } },
      });
      continue;
    }
    await db.channel.create({
      data: {
        name: ch.name,
        description: ch.description,
        minRole: ch.minRole,
        groups: { connect: { id: home.id } },
      },
    });
  }
}

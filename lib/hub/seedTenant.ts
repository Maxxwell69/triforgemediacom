import "server-only";

import { getTenantPrisma } from "@/lib/hub/tenantPrisma";

const DEFAULT_CHANNELS: { name: string; description: string; minRole: "MEMBER" | "CREATOR" | "MOD" }[] =
  [
    { name: "general", description: "General community chat", minRole: "MEMBER" },
    { name: "wins", description: "Share your wins, big or small", minRole: "MEMBER" },
    { name: "creator-lounge", description: "Creators-only discussion", minRole: "CREATOR" },
    { name: "mod-team", description: "Mod/admin coordination", minRole: "MOD" },
  ];

/** Idempotent starter data so a new hub isn’t an empty shell after provision. */
export async function seedTenantDefaults(schema: string) {
  const db = getTenantPrisma(schema);
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

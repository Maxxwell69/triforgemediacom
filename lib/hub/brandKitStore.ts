import "server-only";

import type { PrismaClient } from "@prisma/client";
import { parseBrandKit, type BrandKit } from "@/lib/hub/brandKit";

export async function readClientHubBrandKit(control: PrismaClient, hubId: string): Promise<BrandKit> {
  try {
    const rows = await control.$queryRaw<Array<{ brandKit: unknown }>>`
      SELECT "brandKit" FROM "ClientHub" WHERE id = ${hubId}
    `;
    return parseBrandKit(rows[0]?.brandKit);
  } catch {
    return parseBrandKit(null);
  }
}

export async function readClientHubBrandKitRaw(control: PrismaClient, hubId: string): Promise<unknown> {
  const rows = await control.$queryRaw<Array<{ brandKit: unknown }>>`
    SELECT "brandKit" FROM "ClientHub" WHERE id = ${hubId}
  `;
  return rows[0]?.brandKit ?? null;
}

export async function writeClientHubBrandKit(
  control: PrismaClient,
  hubId: string,
  kit: BrandKit | null
) {
  if (kit == null) {
    await control.$executeRawUnsafe(`UPDATE "ClientHub" SET "brandKit" = NULL WHERE id = $1`, hubId);
    return;
  }
  await control.$executeRawUnsafe(
    `UPDATE "ClientHub" SET "brandKit" = $1::jsonb WHERE id = $2`,
    JSON.stringify(kit),
    hubId
  );
}

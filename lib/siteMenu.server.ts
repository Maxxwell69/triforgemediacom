import "server-only";
import { prisma } from "@/lib/prisma";
import {
  defaultSiteMenuItems,
  parseSiteMenuItems,
  type SiteMenuItem,
} from "@/lib/siteMenu";

export async function getSiteMenuItems(): Promise<SiteMenuItem[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ items: unknown }>>(
      `SELECT items FROM "SiteMenuSettings" WHERE id = 'global' LIMIT 1`
    );
    if (!rows[0]) return defaultSiteMenuItems();
    return parseSiteMenuItems(rows[0].items);
  } catch (err) {
    console.error("getSiteMenuItems failed", err);
    return defaultSiteMenuItems();
  }
}

export async function saveSiteMenuItems(items: SiteMenuItem[]) {
  const parsed = parseSiteMenuItems(items);
  const json = JSON.stringify(parsed);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SiteMenuSettings" (id, items, "updatedAt")
     VALUES ('global', $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET items = EXCLUDED.items, "updatedAt" = NOW()`,
    json
  );
  return parsed;
}

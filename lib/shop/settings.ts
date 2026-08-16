import "server-only";

import { prisma } from "@/lib/prisma";

export const SHOP_SETTINGS_ID = "default";

export async function getOrCreateShopSettings() {
  return prisma.shopSettings.upsert({
    where: { id: SHOP_SETTINGS_ID },
    create: { id: SHOP_SETTINGS_ID },
    update: {},
  });
}

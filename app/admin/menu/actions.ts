"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { parseSiteMenuItems, sanitizeMenuHref, type SiteMenuItem } from "@/lib/siteMenu";
import { saveSiteMenuItems } from "@/lib/siteMenu.server";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
}

export async function saveMenuLineup(items: SiteMenuItem[]) {
  await requireAdmin();
  for (const item of items) {
    if (item.kind !== "custom") continue;
    if (!item.label?.trim() || !sanitizeMenuHref(item.href || "")) {
      throw new Error("Each custom link needs a name and a /path or http(s) URL.");
    }
  }
  const saved = await saveSiteMenuItems(parseSiteMenuItems(items));
  revalidatePath("/admin/menu");
  revalidatePath("/home");
  revalidatePath("/", "layout");
  return saved;
}

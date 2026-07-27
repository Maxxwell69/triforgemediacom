"use server";

import { revalidatePath } from "next/cache";
import type { SocialPlatform } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { SOCIAL_PLATFORM_META } from "@/lib/socialPlatforms";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  // Re-validate against the database instead of trusting the JWT claim alone —
  // closes the window where a banned/demoted admin's existing session would
  // otherwise stay valid until it naturally expires.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

export async function setCompanySocial(formData: FormData) {
  await requireAdmin();

  const platform = String(formData.get("platform") || "") as SocialPlatform;
  const url = String(formData.get("url") || "").trim();

  if (!SOCIAL_PLATFORM_META[platform]) throw new Error("Invalid platform");

  if (!url) {
    await prisma.companySocial.deleteMany({ where: { platform } });
  } else {
    await prisma.companySocial.upsert({
      where: { platform },
      update: { url },
      create: { platform, url },
    });
  }

  revalidatePath("/admin/social");
  revalidatePath("/home");
}

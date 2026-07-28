"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrueAdmin, DM_ACCESS_MODES, type DmAccessMode } from "@/lib/dmAccess";

async function requireTrueAdmin() {
  const session = await auth();
  if (!session?.user || !isTrueAdmin(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function updateDmAccessMode(formData: FormData) {
  await requireTrueAdmin();
  const mode = String(formData.get("dmAccessMode") || "ADMIN");
  if (!DM_ACCESS_MODES.includes(mode as DmAccessMode)) {
    throw new Error("Invalid access mode");
  }
  await prisma.chatSettings.upsert({
    where: { id: "global" },
    update: { dmAccessMode: mode },
    create: { id: "global", dmAccessMode: mode },
  });
  revalidatePath("/admin/chat");
}

export async function addDmAllowedUser(formData: FormData) {
  await requireTrueAdmin();
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) throw new Error("Pick a user");
  const user = await prisma.user.findFirst({
    where: { id: userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");
  await prisma.dmAllowedUser.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  // Ensure allowlist mode is on when adding someone.
  await prisma.chatSettings.upsert({
    where: { id: "global" },
    update: { dmAccessMode: "ALLOWLIST" },
    create: { id: "global", dmAccessMode: "ALLOWLIST" },
  });
  revalidatePath("/admin/chat");
}

export async function removeDmAllowedUser(formData: FormData) {
  await requireTrueAdmin();
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) return;
  await prisma.dmAllowedUser.deleteMany({ where: { userId } });
  revalidatePath("/admin/chat");
}

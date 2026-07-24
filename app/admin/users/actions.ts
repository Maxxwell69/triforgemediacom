"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["ADMIN", "MOD", "CREATOR", "MEMBER"];

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function updateUserRole(userId: string, role: string) {
  const session = await requireAdmin();

  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error("Invalid role");
  }
  if (userId === session.user.id) {
    throw new Error("You can't change your own role");
  }

  await prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } });
  revalidatePath("/admin/users");
}

export async function setUserBanned(userId: string, banned: boolean) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    throw new Error("You can't ban yourself");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: banned ? "BANNED" : "ACTIVE" },
  });
  revalidatePath("/admin/users");
}

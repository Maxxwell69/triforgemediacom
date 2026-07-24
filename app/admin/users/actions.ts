"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { pointsAdjustmentSchema } from "@/lib/validations/points";
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

export async function toggleUserGroup(userId: string, groupId: string, isMember: boolean) {
  await requireAdmin();

  if (isMember) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId },
    });
  } else {
    await prisma.groupMember.deleteMany({ where: { userId, groupId } });
  }

  revalidatePath("/admin/users");
}

export async function adjustUserPoints(formData: FormData) {
  await requireAdmin();

  const parsed = pointsAdjustmentSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid adjustment");
  }

  await prisma.xPEvent.create({
    data: {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      source: "MANUAL_ADJUSTMENT",
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/admin/users");
}

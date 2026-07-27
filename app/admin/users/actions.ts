"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { pointsAdjustmentSchema } from "@/lib/validations/points";
import { addMemberSchema } from "@/lib/validations/addMember";
import { generateInviteToken, inviteUrl } from "@/lib/invite";
import { sendInviteEmail } from "@/lib/email";
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

export type AddMemberState = { error?: string; success?: boolean } | null;

/**
 * Adds someone straight to the network, bypassing the /apply review queue —
 * for people you already know and want to invite directly (e.g. staff,
 * partners, existing talent). Creates the same INVITED user + approved
 * Application + invite email as the normal approval flow, just skipped
 * ahead to "approved".
 */
export async function addMemberDirectly(
  _prevState: AddMemberState,
  formData: FormData
): Promise<AddMemberState> {
  await requireAdmin();

  const parsed = addMemberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const { name, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const token = generateInviteToken();

  await prisma.user.create({
    data: {
      email,
      name,
      status: "INVITED",
      application: {
        create: {
          answers: { name, addedDirectlyByAdmin: true },
          status: "APPROVED",
          inviteToken: token,
          reviewedAt: new Date(),
        },
      },
    },
  });

  await sendInviteEmail(email, name, inviteUrl(token));

  revalidatePath("/admin/users");
  return { success: true };
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

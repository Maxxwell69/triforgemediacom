"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { pointsAdjustmentSchema } from "@/lib/validations/points";
import { addMemberSchema } from "@/lib/validations/addMember";
import { generateInviteToken, inviteTokenExpiry, inviteUrl } from "@/lib/invite";
import { sendInviteEmail } from "@/lib/email";
import type { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = ["ADMIN", "MOD", "CREATOR", "MEMBER"];

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  // Re-validate against the database instead of trusting the JWT claim alone —
  // closes the window where a banned/demoted admin's existing session would
  // otherwise stay valid until it naturally expires, and makes sure the role
  // used for the escalation guards below (e.g. in updateUserRole) can't be a
  // stale, already-revoked ADMIN claim.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

export async function updateUserRole(userId: string, role: string) {
  const session = await requireAdmin();

  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new Error("Invalid role");
  }
  if (userId === session.user.id) {
    throw new Error("You can't change your own role");
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) {
    throw new Error("User not found");
  }

  // A MOD can manage MEMBER/CREATOR roles, but only a true ADMIN may touch an
  // existing ADMIN/MOD's role or grant ADMIN/MOD to anyone — otherwise a MOD
  // could promote a sock-puppet to ADMIN or demote a real admin.
  const touchesPrivilegedTarget = isAdminRole(target.role);
  const grantsPrivilegedRole = isAdminRole(role as UserRole);
  if ((touchesPrivilegedTarget || grantsPrivilegedRole) && session.user.role !== "ADMIN") {
    throw new Error("Only an admin can grant or change admin/mod roles");
  }

  await prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setUserBanned(userId: string, banned: boolean) {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    throw new Error("You can't ban yourself");
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) {
    throw new Error("User not found");
  }
  // A MOD can never ban an ADMIN or another MOD — only a true ADMIN can.
  if (isAdminRole(target.role) && session.user.role !== "ADMIN") {
    throw new Error("Only an admin can ban another admin or mod");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: banned ? "BANNED" : "ACTIVE" },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setReceivesAdminAlerts(userId: string, receives: boolean) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { receivesAdminAlerts: receives },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function setHiddenFromDirectory(userId: string, hidden: boolean) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { hiddenFromDirectory: hidden },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/members");
}

export async function toggleUserGroup(userId: string, groupId: string, isMember: boolean) {
  await requireAdmin();

  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
  const networkName = group?.name.toUpperCase();

  if (networkName === "CN" || networkName === "MN") {
    const { syncNetworkMembership, CN_GROUP_NAME, CN_TAG_NAME, MN_GROUP_NAME, MN_TAG_NAME } =
      await import("@/lib/mnCn");
    if (isMember) {
      await syncNetworkMembership(userId, networkName);
    } else {
      const name = networkName === "CN" ? CN_TAG_NAME : MN_TAG_NAME;
      const gName = networkName === "CN" ? CN_GROUP_NAME : MN_GROUP_NAME;
      const [t, g] = await Promise.all([
        prisma.tag.findUnique({ where: { name } }),
        prisma.group.findUnique({ where: { name: gName } }),
      ]);
      await Promise.all([
        t ? prisma.userTag.deleteMany({ where: { userId, tagId: t.id } }) : null,
        g ? prisma.groupMember.deleteMany({ where: { userId, groupId: g.id } }) : null,
      ]);
    }
  } else if (isMember) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId },
    });
  } else {
    await prisma.groupMember.deleteMany({ where: { userId, groupId } });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/members");
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
          inviteTokenExpiresAt: inviteTokenExpiry(),
          reviewedAt: new Date(),
        },
      },
    },
  });

  try {
    await sendInviteEmail(email, name, inviteUrl(token));
  } catch (err) {
    console.error("Failed to send invite email to", email, err);
    revalidatePath("/admin/users");
    return {
      error: `Member was added, but the invite email failed to send (${
        err instanceof Error ? err.message : "unknown error"
      }). Check RESEND_API_KEY / RESEND_FROM_EMAIL, then resend from the Users list.`,
    };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resendInvite(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { application: true },
  });
  if (!user) throw new Error("User not found");
  if (user.status !== "INVITED") throw new Error("This user isn't in an invited state");

  // Always issue a fresh token + expiry on resend rather than reusing a
  // possibly-expired one, so "resend" reliably gives the user a working link.
  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();
  if (user.application) {
    await prisma.application.update({
      where: { id: user.application.id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });
  } else {
    await prisma.application.create({
      data: {
        userId: user.id,
        answers: { name: user.name, addedDirectlyByAdmin: true },
        status: "APPROVED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
        reviewedAt: new Date(),
      },
    });
  }

  await sendInviteEmail(user.email, user.name || "there", inviteUrl(token));
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
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
  revalidatePath(`/admin/users/${parsed.data.userId}`);
}

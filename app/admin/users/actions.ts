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

/** Admin-only: green CN badge text when enabled. */
export async function setUserEffect(userId: string, effect: boolean) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { effect },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
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

/**
 * Set or clear a member's TikTok profile URL (socialLinks.tiktok), then refresh
 * stats/live status when a valid handle is present.
 */
export async function updateUserTikTokLink(
  userId: string,
  tiktokUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: { select: { socialLinks: true } },
    },
  });
  if (!user) {
    return { ok: false, error: "User not found" };
  }
  if (!user.profile) {
    return { ok: false, error: "Member has no profile yet" };
  }

  const raw = tiktokUrl.trim();
  const { parseTikTokUniqueId } = await import("@/lib/tiktools");
  const uniqueId = raw ? parseTikTokUniqueId(raw) : null;

  if (raw && !uniqueId) {
    return {
      ok: false,
      error: "Enter a TikTok profile URL (tiktok.com/@handle) or @handle.",
    };
  }

  const socialLinks = {
    ...((user.profile.socialLinks as Record<string, string> | null) ?? {}),
  };

  if (uniqueId) {
    socialLinks.tiktok = raw.startsWith("http")
      ? raw
      : `https://www.tiktok.com/@${uniqueId}`;
  } else {
    delete socialLinks.tiktok;
  }

  await prisma.profile.update({
    where: { userId },
    data: { socialLinks },
  });

  if (uniqueId) {
    const { refreshTikTokStatsSnapshot } = await import("@/lib/tiktokStats");
    await refreshTikTokStatsSnapshot(userId, { force: true }).catch((err) => {
      console.error("Admin TikTok stats refresh failed:", err);
    });
  }

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/members/${userId}`);
  revalidatePath("/members");
  revalidatePath("/live");
  revalidatePath("/account");
  revalidatePath("/account/insights");
  return { ok: true };
}

/** Force-refresh tik.tools creator insights for a member (admin user page). */
export async function refreshUserCreatorInsightsAction(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const { refreshTikTokStatsSnapshot } = await import("@/lib/tiktokStats");
  const result = await refreshTikTokStatsSnapshot(userId, { force: true });
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/members/${userId}`);
  revalidatePath("/live");
  revalidatePath("/account");
  revalidatePath("/account/insights");
  return result;
}

export async function refreshUserCreatorInsightsFormAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const userId = String(formData.get("userId") || "");
  if (!userId) redirect("/admin/users");

  let result: { ok: true } | { ok: false; error: string };
  try {
    result = await refreshUserCreatorInsightsAction(userId);
  } catch (err) {
    // Never let this form action throw — Next surfaces that as Application error.
    console.error("refreshUserCreatorInsightsFormAction failed:", err);
    result = {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn't refresh creator insights.",
    };
  }

  if (!result.ok) {
    redirect(
      `/admin/users/${userId}?insights=error&insights_message=${encodeURIComponent(result.error)}`
    );
  }
  redirect(`/admin/users/${userId}?insights=refreshed`);
}

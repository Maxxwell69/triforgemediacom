"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { badgeSchema } from "@/lib/validations/badge";
import { sendBadgeEarnedEmail } from "@/lib/email";

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

/**
 * Creates a badge with no course attached — for manually recognizing
 * members (e.g. "MVP", "Early Supporter") independent of course completion.
 */
export async function createStandaloneBadge(formData: FormData) {
  await requireAdmin();

  const parsed = badgeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid badge");
  }

  await prisma.badge.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
    },
  });

  revalidatePath("/admin/badges");
}

export async function setUserBadgeAdded(badgeId: string, userId: string, added: boolean) {
  await requireAdmin();

  if (added) {
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });

    if (!existing) {
      const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
      if (!badge) throw new Error("Badge not found");

      await prisma.userBadge.create({ data: { userId, badgeId } });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (user) {
        try {
          await sendBadgeEarnedEmail(user.email, user.name || "there", badge.name, badge.icon);
        } catch (err) {
          console.error("Failed to send manual badge-award email:", err);
        }
      }
    }
  } else {
    await prisma.userBadge.deleteMany({ where: { userId, badgeId } });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/badges");
  revalidatePath("/account");
}

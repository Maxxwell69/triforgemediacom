"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUserGroupIds } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { ACTIVE_GROUP_COOKIE } from "@/lib/activeGroup";

export async function setActiveGroupAction(groupId: string): Promise<{ error: string | null }> {
  const user = await requireUser();
  const [memberIds, group] = await Promise.all([
    getUserGroupIds(user.id),
    prisma.group.findUnique({ where: { id: groupId }, select: { id: true } }),
  ]);

  if (!group) return { error: "Group not found" };

  const session = await auth();
  if (!isAdminRole(session?.user?.role) && !memberIds.includes(groupId)) {
    return { error: "You are not a member of that group" };
  }

  cookies().set(ACTIVE_GROUP_COOKIE, groupId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { error: null };
}

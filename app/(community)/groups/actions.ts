"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groupApplicationMessageSchema } from "@/lib/validations/group";

async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true, email: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE") throw new Error("Not authorized");
  return dbUser;
}

export async function applyToGroup(
  groupId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const parsed = groupApplicationMessageSchema.safeParse({
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid message" };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, isHome: true, joinMode: true },
  });
  if (!group || group.isHome) return { error: "Group not found" };
  if (group.joinMode !== "APPLY") {
    return { error: "This group does not accept applications" };
  }

  const existingMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (existingMember) return { error: "You are already a member" };

  await prisma.groupApplication.upsert({
    where: { groupId_userId: { groupId, userId: user.id } },
    update: {
      message: parsed.data.message || null,
      status: "PENDING",
      reviewedById: null,
      reviewedAt: null,
    },
    create: {
      groupId,
      userId: user.id,
      message: parsed.data.message || null,
    },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}`);
  return { error: null };
}

export async function acceptGroupInvite(
  token: string
): Promise<{ error: string | null; groupId?: string }> {
  const user = await requireActiveUser();

  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    include: { group: { select: { id: true, isHome: true, joinMode: true, name: true } } },
  });

  if (!invite || invite.acceptedAt) {
    return { error: "This invite is invalid or already used." };
  }
  if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
    return { error: "This invite has expired." };
  }
  if (invite.group.isHome || invite.group.joinMode === "CLOSED") {
    return { error: "This invite is no longer valid." };
  }
  if (invite.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "This invite was issued for a different email address." };
  }

  await prisma.$transaction([
    prisma.groupMember.upsert({
      where: { userId_groupId: { userId: user.id, groupId: invite.groupId } },
      update: {},
      create: { userId: user.id, groupId: invite.groupId, role: "MEMBER" },
    }),
    prisma.groupInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  revalidatePath("/groups");
  revalidatePath(`/groups/${invite.groupId}`);
  return { error: null, groupId: invite.groupId };
}

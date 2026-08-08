"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageGroup } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import { groupApplicationMessageSchema } from "@/lib/validations/group";
import { z } from "zod";

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

const groupChannelSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function applyToGroup(
  groupId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  if (isAdminRole(user.role)) {
    return { error: "Staff already have access to every group" };
  }
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

  // Claim the invite atomically so two concurrent accepts can't both succeed.
  const claimed = await prisma.groupInvite.updateMany({
    where: { id: invite.id, acceptedAt: null },
    data: { acceptedAt: new Date() },
  });
  if (claimed.count !== 1) {
    return { error: "This invite is invalid or already used." };
  }

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: user.id, groupId: invite.groupId } },
    update: {},
    create: { userId: user.id, groupId: invite.groupId, role: "MEMBER" },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${invite.groupId}`);
  return { error: null, groupId: invite.groupId };
}

/** Group managers (or hub admins) create a channel scoped to this group. */
export async function createGroupChannel(
  groupId: string,
  formData: FormData
): Promise<{ error: string | null; channelId?: string }> {
  const user = await requireActiveUser();

  if (!(await canManageGroup(user.id, user.role, groupId))) {
    return { error: "Only group managers can create channels for this space." };
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, isHome: true },
  });
  if (!group) return { error: "Group not found" };

  const parsed = groupChannelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid channel" };
  }

  // Normalize Discord-style names: lowercase, spaces → hyphens
  const name = parsed.data.name.toLowerCase().replace(/\s+/g, "-");

  const channel = await prisma.channel.create({
    data: {
      name,
      description: parsed.data.description || null,
      minRole: "MEMBER",
      groups: { connect: { id: groupId } },
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/admin/channels");
  revalidatePath("/channels");
  return { error: null, channelId: channel.id };
}

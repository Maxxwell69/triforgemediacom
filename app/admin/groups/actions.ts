"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import {
  bootstrapHomeSpace,
  generateGroupInviteToken,
  groupInviteUrl,
} from "@/lib/groups";
import { groupMemberRoleSchema, groupSchema } from "@/lib/validations/group";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

function parseGroupForm(formData: FormData) {
  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
    imageUrl: formData.get("imageUrl") || "",
    joinMode: formData.get("joinMode") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid group");
  }
  return parsed.data;
}

function revalidateGroupPaths(groupId?: string) {
  revalidatePath("/admin/groups");
  revalidatePath("/groups");
  if (groupId) {
    revalidatePath(`/admin/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}`);
  }
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const data = parseGroupForm(formData);
  const grantsTikTaskAccess = formData.get("grantsTikTaskAccess") === "on";
  const showInList = formData.get("showInList") === "on";

  await prisma.group.create({
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      imageUrl: data.imageUrl || null,
      grantsTikTaskAccess,
      showInList,
      joinMode: data.joinMode ?? "INVITE_ONLY",
    },
  });

  revalidateGroupPaths();
}

export async function updateGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const existing = await prisma.group.findUnique({
    where: { id },
    select: { isHome: true, name: true },
  });
  if (!existing) throw new Error("Group not found");

  // Home name is locked in the UI (disabled input). Disabled fields are omitted
  // from FormData, so restore the stored name before validation.
  if (existing.isHome) {
    formData.set("name", existing.name);
  }

  const data = parseGroupForm(formData);
  const grantsTikTaskAccess = formData.get("grantsTikTaskAccess") === "on";
  // Home is always listed; other groups honor the checkbox.
  const showInList = existing.isHome || formData.get("showInList") === "on";

  await prisma.group.update({
    where: { id },
    data: {
      name: existing.isHome ? undefined : data.name,
      description: data.description || null,
      color: data.color,
      imageUrl: data.imageUrl || null,
      grantsTikTaskAccess,
      showInList,
      // Home stays CLOSED — join is automatic via hub membership.
      joinMode: existing.isHome ? "CLOSED" : data.joinMode ?? "INVITE_ONLY",
    },
  });

  revalidateGroupPaths(id);
}

export async function deleteGroup(groupId: string) {
  await requireAdmin();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { isHome: true, name: true },
  });
  if (!group) throw new Error("Group not found");
  if (group.isHome) throw new Error("Cannot delete the Home group");

  await prisma.group.delete({ where: { id: groupId } });
  revalidateGroupPaths();
}

export async function setGroupChannels(groupId: string, channelIds: string[]) {
  await requireAdmin();
  await prisma.group.update({
    where: { id: groupId },
    data: { channels: { set: channelIds.map((id) => ({ id })) } },
  });
  revalidateGroupPaths(groupId);
  revalidatePath("/channels");
}

export async function setGroupMemberAdded(groupId: string, userId: string, added: boolean) {
  await requireAdmin();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, isHome: true },
  });
  if (!group) throw new Error("Group not found");

  if (!added && group.isHome) {
    throw new Error("Cannot remove members from Home — every hub member belongs there.");
  }

  const networkName = group.name.toUpperCase();

  if (networkName === "CN" || networkName === "MN") {
    const { syncNetworkMembership, CN_GROUP_NAME, CN_TAG_NAME, MN_GROUP_NAME, MN_TAG_NAME } =
      await import("@/lib/mnCn");
    if (added) {
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
  } else if (added) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId, role: "MEMBER" },
    });
  } else {
    await prisma.groupMember.deleteMany({ where: { userId, groupId } });
  }

  revalidateGroupPaths(groupId);
  revalidatePath("/admin/users");
  revalidatePath("/members");
}

export async function setGroupMemberRole(
  groupId: string,
  userId: string,
  role: string
): Promise<{ error: string | null }> {
  await requireAdmin();
  const parsed = groupMemberRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Invalid role" };

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { isHome: true },
  });
  if (!group) return { error: "Group not found" };

  await prisma.groupMember.update({
    where: { userId_groupId: { userId, groupId } },
    data: { role: parsed.data },
  });

  revalidateGroupPaths(groupId);
  return { error: null };
}

export async function createGroupInviteLink(
  groupId: string,
  email?: string
): Promise<{ error: string | null; url?: string }> {
  const session = await requireAdmin();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { isHome: true, joinMode: true },
  });
  if (!group) return { error: "Group not found" };
  if (group.isHome) return { error: "Home does not use invite links" };
  if (group.joinMode === "CLOSED") return { error: "This group is closed to invites" };

  const token = generateGroupInviteToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.groupInvite.create({
    data: {
      groupId,
      token,
      email: email?.trim() || null,
      invitedById: session.user.id,
      expiresAt,
    },
  });

  revalidateGroupPaths(groupId);
  return { error: null, url: groupInviteUrl(token) };
}

export async function reviewGroupApplication(
  applicationId: string,
  decision: "APPROVED" | "REJECTED"
): Promise<{ error: string | null }> {
  await requireAdmin();

  const app = await prisma.groupApplication.findUnique({
    where: { id: applicationId },
    include: { group: { select: { id: true, isHome: true } } },
  });
  if (!app || app.status !== "PENDING") return { error: "Application not found" };

  const session = await auth();
  if (!session) return { error: "Not authorized" };

  await prisma.$transaction(async (tx) => {
    await tx.groupApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });
    if (decision === "APPROVED") {
      await tx.groupMember.upsert({
        where: { userId_groupId: { userId: app.userId, groupId: app.groupId } },
        update: {},
        create: { userId: app.userId, groupId: app.groupId, role: "MEMBER" },
      });
    }
  });

  revalidateGroupPaths(app.groupId);
  return { error: null };
}

export async function runHomeBootstrap(): Promise<{
  error: string | null;
  enrolledUsers?: number;
  attachedChannels?: number;
}> {
  await requireAdmin();
  const result = await bootstrapHomeSpace();
  revalidateGroupPaths(result.homeId);
  revalidatePath("/channels");
  return {
    error: null,
    enrolledUsers: result.enrolledUsers,
    attachedChannels: result.attachedChannels,
  };
}

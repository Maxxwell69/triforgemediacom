"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { groupSchema } from "@/lib/validations/group";

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

function parseGroupForm(formData: FormData) {
  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid group");
  }
  return parsed.data;
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const data = parseGroupForm(formData);
  const grantsTikTaskAccess = formData.get("grantsTikTaskAccess") === "on";

  await prisma.group.create({
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      grantsTikTaskAccess,
    },
  });

  revalidatePath("/admin/groups");
}

export async function updateGroup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseGroupForm(formData);
  const grantsTikTaskAccess = formData.get("grantsTikTaskAccess") === "on";

  await prisma.group.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      grantsTikTaskAccess,
    },
  });

  revalidatePath("/admin/groups");
  revalidatePath(`/admin/groups/${id}`);
}

export async function deleteGroup(groupId: string) {
  await requireAdmin();
  await prisma.group.delete({ where: { id: groupId } });
  revalidatePath("/admin/groups");
}

export async function setGroupChannels(groupId: string, channelIds: string[]) {
  await requireAdmin();
  await prisma.group.update({
    where: { id: groupId },
    data: { channels: { set: channelIds.map((id) => ({ id })) } },
  });
  revalidatePath(`/admin/groups/${groupId}`);
}

export async function setGroupMemberAdded(groupId: string, userId: string, added: boolean) {
  await requireAdmin();

  if (added) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId },
    });
  } else {
    await prisma.groupMember.deleteMany({ where: { userId, groupId } });
  }

  revalidatePath(`/admin/groups/${groupId}`);
  revalidatePath("/admin/users");
}

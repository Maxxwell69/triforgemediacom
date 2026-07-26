"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { tagSchema } from "@/lib/validations/tag";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function parseTagForm(formData: FormData) {
  const parsed = tagSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid tag");
  }
  return parsed.data;
}

export async function createTag(formData: FormData) {
  await requireAdmin();
  const data = parseTagForm(formData);
  const selfAssignable = formData.get("selfAssignable") === "on";

  await prisma.tag.create({
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      selfAssignable,
    },
  });

  revalidatePath("/admin/tags");
}

export async function updateTag(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseTagForm(formData);
  const selfAssignable = formData.get("selfAssignable") === "on";

  await prisma.tag.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      selfAssignable,
    },
  });

  revalidatePath("/admin/tags");
  revalidatePath(`/admin/tags/${id}`);
  revalidatePath("/members");
}

export async function deleteTag(tagId: string) {
  await requireAdmin();
  await prisma.tag.delete({ where: { id: tagId } });
  revalidatePath("/admin/tags");
  revalidatePath("/members");
}

export async function setUserTagAdded(tagId: string, userId: string, added: boolean) {
  await requireAdmin();

  if (added) {
    await prisma.userTag.upsert({
      where: { userId_tagId: { userId, tagId } },
      update: {},
      create: { userId, tagId },
    });
  } else {
    await prisma.userTag.deleteMany({ where: { userId, tagId } });
  }

  revalidatePath(`/admin/tags/${tagId}`);
  revalidatePath("/admin/users");
  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
}

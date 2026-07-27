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

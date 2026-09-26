"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTrueAdmin } from "@/lib/rbac";
import { isClientHubRequest } from "@/lib/hub/requestHost";
import {
  ensureDefaultMemberTypes,
  sanitizeAllowedMenuIds,
} from "@/lib/hub/memberTypes";

async function requireHubAdmin() {
  const session = await auth();
  if (!session?.user || !isTrueAdmin(session.user.role) || !isClientHubRequest()) {
    throw new Error("Not authorized");
  }
  return session;
}

export async function createMemberType(formData: FormData) {
  await requireHubAdmin();
  await ensureDefaultMemberTypes();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  const last = await prisma.hubMemberType.findFirst({ orderBy: { sortOrder: "desc" } });
  await prisma.hubMemberType.create({
    data: {
      name,
      sortOrder: (last?.sortOrder ?? 2) + 1,
      allowedMenuIds: [],
    },
  });
  revalidatePath("/admin/member-types");
}

export async function updateMemberType(formData: FormData) {
  await requireHubAdmin();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) throw new Error("Name is required");
  const allowedMenuIds = sanitizeAllowedMenuIds(
    formData.getAll("allowedMenuId").map((v) => String(v))
  );
  const signupDefault = formData.get("signupDefault") === "on";
  await prisma.$transaction(async (tx) => {
    if (signupDefault) {
      await tx.hubMemberType.updateMany({ data: { signupDefault: false } });
    }
    await tx.hubMemberType.update({
      where: { id },
      data: { name, allowedMenuIds, signupDefault },
    });
  });
  revalidatePath("/admin/member-types");
  revalidatePath("/admin/users");
}

export async function deleteMemberType(formData: FormData) {
  await requireHubAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) return;
  const row = await prisma.hubMemberType.findUnique({ where: { id } });
  if (!row || row.key) throw new Error("Built-in types can't be deleted");
  const fallback = await prisma.hubMemberType.findFirst({
    where: { key: "member" },
    select: { id: true },
  });
  await prisma.$transaction(async (tx) => {
    if (fallback) {
      await tx.user.updateMany({
        where: { memberTypeId: id },
        data: { memberTypeId: fallback.id },
      });
    } else {
      await tx.user.updateMany({
        where: { memberTypeId: id },
        data: { memberTypeId: null },
      });
    }
    await tx.hubMemberType.delete({ where: { id } });
  });
  revalidatePath("/admin/member-types");
  revalidatePath("/admin/users");
}

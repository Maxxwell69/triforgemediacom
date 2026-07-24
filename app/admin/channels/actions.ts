"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { channelSchema } from "@/lib/validations/channel";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function parseChannelForm(formData: FormData) {
  const parsed = channelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    minRole: formData.get("minRole"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid channel");
  }
  return parsed.data;
}

export async function createChannel(formData: FormData) {
  await requireAdmin();
  const data = parseChannelForm(formData);

  await prisma.channel.create({
    data: {
      name: data.name,
      description: data.description || null,
      minRole: data.minRole,
    },
  });

  revalidatePath("/admin/channels");
}

export async function updateChannel(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseChannelForm(formData);

  await prisma.channel.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      minRole: data.minRole,
    },
  });

  revalidatePath("/admin/channels");
}

export async function deleteChannel(channelId: string) {
  await requireAdmin();
  await prisma.channel.delete({ where: { id: channelId } });
  revalidatePath("/admin/channels");
}

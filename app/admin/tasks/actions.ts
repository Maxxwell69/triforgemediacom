"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { taskTemplateSchema } from "@/lib/validations/taskTemplate";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
}

function parseTemplateForm(formData: FormData) {
  const rawPlatform = formData.get("platform");
  const rawGoalKey = formData.get("goalKey");

  const parsed = taskTemplateSchema.safeParse({
    platform: rawPlatform ? rawPlatform : null,
    goalKey: rawGoalKey ? rawGoalKey : null,
    taskText: formData.get("taskText"),
    xpValue: formData.get("xpValue"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid task template");
  }
  return parsed.data;
}

export async function createTaskTemplate(formData: FormData) {
  await requireAdmin();
  const data = parseTemplateForm(formData);

  await prisma.taskTemplate.create({
    data: {
      platform: data.platform || null,
      goalKey: data.goalKey || null,
      taskText: data.taskText,
      xpValue: data.xpValue,
    },
  });

  revalidatePath("/admin/tasks");
}

export async function updateTaskTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = parseTemplateForm(formData);

  await prisma.taskTemplate.update({
    where: { id },
    data: {
      platform: data.platform || null,
      goalKey: data.goalKey || null,
      taskText: data.taskText,
      xpValue: data.xpValue,
    },
  });

  revalidatePath("/admin/tasks");
}

export async function setTaskTemplateActive(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.taskTemplate.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/tasks");
}

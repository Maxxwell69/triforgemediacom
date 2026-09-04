"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPersonalTasksAccess } from "@/lib/personalTasks";
import {
  createPersonalTaskSchema,
  personalTaskStatusOptions,
  updatePersonalTaskSchema,
} from "@/lib/validations/personalTask";
import { parseDateOnly } from "@/lib/time";
import { z } from "zod";

async function requirePersonalTasksUser(): Promise<
  { userId: string; error?: undefined } | { userId?: undefined; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authorized" };
  if (!(await hasPersonalTasksAccess(session.user.id))) {
    return { error: "Personal Tasks isn't enabled for your account." };
  }
  return { userId: session.user.id };
}

function parseDueAt(raw: string | null | undefined): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const dateOnly = parseDateOnly(raw);
  if (dateOnly) return dateOnly;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function revalidateTasks() {
  revalidatePath("/apps/tasks");
  revalidatePath("/account");
}

export async function createPersonalTask(
  formData: FormData
): Promise<{ error: string | null }> {
  const gate = await requirePersonalTasksUser();
  if (gate.error || !gate.userId) return { error: gate.error ?? "Not authorized" };

  const parsed = createPersonalTaskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") || "",
    dueAt: formData.get("dueAt") || "",
    category: formData.get("category") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid task" };
  }

  const maxOrder = await prisma.personalTask.aggregate({
    where: { userId: gate.userId },
    _max: { sortOrder: true },
  });

  await prisma.personalTask.create({
    data: {
      userId: gate.userId,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueAt: parseDueAt(parsed.data.dueAt) ?? null,
      category: parsed.data.category || null,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  revalidateTasks();
  return { error: null };
}

export async function updatePersonalTask(
  taskId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const gate = await requirePersonalTasksUser();
  if (gate.error || !gate.userId) return { error: gate.error ?? "Not authorized" };

  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId: gate.userId },
    select: { id: true },
  });
  if (!existing) return { error: "Task not found" };

  const parsed = updatePersonalTaskSchema.safeParse({
    title: formData.get("title") || undefined,
    notes: formData.has("notes") ? String(formData.get("notes") ?? "") : undefined,
    status: formData.get("status") || undefined,
    dueAt: formData.has("dueAt") ? String(formData.get("dueAt") ?? "") : undefined,
    category: formData.has("category") ? String(formData.get("category") ?? "") : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid update" };
  }

  const data: {
    title?: string;
    notes?: string | null;
    status?: (typeof personalTaskStatusOptions)[number];
    dueAt?: Date | null;
    category?: string | null;
  } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.dueAt !== undefined) data.dueAt = parseDueAt(parsed.data.dueAt) ?? null;
  if (parsed.data.category !== undefined) data.category = parsed.data.category || null;

  await prisma.personalTask.update({ where: { id: taskId }, data });
  revalidateTasks();
  return { error: null };
}

export async function setPersonalTaskStatus(
  taskId: string,
  status: string
): Promise<{ error: string | null }> {
  const gate = await requirePersonalTasksUser();
  if (gate.error || !gate.userId) return { error: gate.error ?? "Not authorized" };

  const parsed = z.enum(personalTaskStatusOptions).safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };

  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId: gate.userId },
    select: { id: true },
  });
  if (!existing) return { error: "Task not found" };

  await prisma.personalTask.update({
    where: { id: taskId },
    data: { status: parsed.data },
  });
  revalidateTasks();
  return { error: null };
}

export async function deletePersonalTask(
  taskId: string
): Promise<{ error: string | null }> {
  const gate = await requirePersonalTasksUser();
  if (gate.error || !gate.userId) return { error: gate.error ?? "Not authorized" };

  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId: gate.userId },
    select: { id: true },
  });
  if (!existing) return { error: "Task not found" };

  await prisma.personalTask.delete({ where: { id: taskId } });
  revalidateTasks();
  return { error: null };
}

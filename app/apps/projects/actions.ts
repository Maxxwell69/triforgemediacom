"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCanSeeProject } from "@/lib/projects";
import { projectTaskStatusOptions } from "@/lib/validations/project";
import { z } from "zod";

async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE") throw new Error("Not authorized");
  return dbUser;
}

export async function updateMyProjectTaskStatus(
  taskId: string,
  status: string
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const parsed = z.enum(projectTaskStatusOptions).safeParse(status);
  if (!parsed.success) return { error: "Invalid status" };

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true, assigneeId: true },
  });
  if (!task) return { error: "Task not found" };

  const canSee = await userCanSeeProject(user.id, task.projectId);
  const isAssignee = task.assigneeId === user.id;
  if (!canSee || !isAssignee) {
    return { error: "You can only update tasks assigned to you." };
  }

  await prisma.projectTask.update({
    where: { id: taskId },
    data: { status: parsed.data },
  });

  revalidatePath("/apps/projects");
  revalidatePath(`/apps/projects/${task.projectId}`);
  revalidatePath(`/admin/projects/${task.projectId}`);
  return { error: null };
}

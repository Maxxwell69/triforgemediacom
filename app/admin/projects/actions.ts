"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { projectSchema, projectTaskSchema } from "@/lib/validations/project";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true, id: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, id: dbUser.id, role: dbUser.role, status: dbUser.status } };
}

function revalidateProject(projectId?: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/apps/projects");
  if (projectId) {
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/apps/projects/${projectId}`);
  }
}

export async function createProject(formData: FormData) {
  const session = await requireAdmin();
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || "ACTIVE",
    groupId: formData.get("groupId") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid project");
  }

  const project = await prisma.project.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status ?? "ACTIVE",
      groupId: parsed.data.groupId || null,
      createdById: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  revalidateProject(project.id);
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || undefined,
    groupId: formData.get("groupId") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid project");
  }

  await prisma.project.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      groupId: parsed.data.groupId || null,
    },
  });

  revalidateProject(id);
}

export async function archiveProject(projectId: string) {
  await requireAdmin();
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ARCHIVED" },
  });
  revalidateProject(projectId);
}

export async function setProjectMember(
  projectId: string,
  userId: string,
  added: boolean
) {
  await requireAdmin();
  if (added) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: {},
      create: { projectId, userId, role: "MEMBER" },
    });
  } else {
    await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  }
  revalidateProject(projectId);
}

export async function createProjectTask(projectId: string, formData: FormData) {
  const session = await requireAdmin();
  const parsed = projectTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || "TODO",
    assigneeId: formData.get("assigneeId") || "",
    dueAt: formData.get("dueAt") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid task");
  }

  const assigneeId = parsed.data.assigneeId || null;
  let dueAt: Date | null = null;
  if (parsed.data.dueAt) {
    dueAt = new Date(parsed.data.dueAt);
    if (Number.isNaN(dueAt.getTime())) throw new Error("Invalid due date");
  }

  const maxSort = await prisma.projectTask.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.projectTask.create({
      data: {
        projectId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status ?? "TODO",
        assigneeId,
        dueAt,
        createdById: session.user.id,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    // Assignees automatically get project visibility.
    if (assigneeId) {
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: assigneeId } },
        update: {},
        create: { projectId, userId: assigneeId, role: "MEMBER" },
      });
    }
  });

  revalidateProject(projectId);
}

export async function updateProjectTask(taskId: string, formData: FormData) {
  await requireAdmin();
  const parsed = projectTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || undefined,
    assigneeId: formData.get("assigneeId") || "",
    dueAt: formData.get("dueAt") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid task");
  }

  const existing = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!existing) throw new Error("Task not found");

  const assigneeId = parsed.data.assigneeId || null;
  let dueAt: Date | null = null;
  if (parsed.data.dueAt) {
    dueAt = new Date(parsed.data.dueAt);
    if (Number.isNaN(dueAt.getTime())) throw new Error("Invalid due date");
  } else if (formData.has("dueAt")) {
    dueAt = null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectTask.update({
      where: { id: taskId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status,
        assigneeId,
        ...(formData.has("dueAt") ? { dueAt } : {}),
      },
    });
    if (assigneeId) {
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId: existing.projectId, userId: assigneeId } },
        update: {},
        create: { projectId: existing.projectId, userId: assigneeId, role: "MEMBER" },
      });
    }
  });

  revalidateProject(existing.projectId);
}

export async function setProjectTaskStatus(taskId: string, status: string) {
  await requireAdmin();
  const parsed = projectTaskSchema.shape.status.safeParse(status);
  if (!parsed.success || !parsed.data) throw new Error("Invalid status");

  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: { status: parsed.data },
    select: { projectId: true },
  });
  revalidateProject(task.projectId);
}

export async function deleteProjectTask(taskId: string) {
  await requireAdmin();
  const task = await prisma.projectTask.delete({
    where: { id: taskId },
    select: { projectId: true },
  });
  revalidateProject(task.projectId);
}

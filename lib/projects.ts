import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Hub Projects — admin-assigned work, distinct from TikTask daily habits.
 *
 * Visibility rule (v1): a member sees a project only if they are a
 * ProjectMember and/or assigned to at least one ProjectTask on it.
 * Admins/mods see everything via admin UI.
 */

export async function listVisibleProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: {
      OR: [
        { members: { some: { userId } } },
        { tasks: { some: { assigneeId: userId } } },
      ],
      status: { not: "ARCHIVED" },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { tasks: true, members: true } },
    },
  });
}

export async function userCanSeeProject(userId: string, projectId: string) {
  const hit = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { members: { some: { userId } } },
        { tasks: { some: { assigneeId: userId } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(hit);
}

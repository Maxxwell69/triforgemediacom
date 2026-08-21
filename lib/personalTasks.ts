import "server-only";

import { prisma } from "@/lib/prisma";

export async function hasPersonalTasksAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { personalTasksEnabled: true, status: true },
  });
  return Boolean(user?.status === "ACTIVE" && user.personalTasksEnabled !== false);
}

export async function listPersonalTasks(userId: string) {
  return prisma.personalTask.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

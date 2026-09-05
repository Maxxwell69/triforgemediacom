import { notFound } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { isAdminRole } from "@/lib/rbac";

export function requireSupportModule() {
  if (!hubHas("support")) notFound();
}

export async function ensureSupportTicketRead(userId: string) {
  await prisma.supportTicketRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: new Date() },
    update: {},
  });
}

export async function markSupportTicketsRead(userId: string, at = new Date()) {
  await prisma.supportTicketRead.upsert({
    where: { userId },
    create: { userId, lastReadAt: at },
    update: { lastReadAt: at },
  });
}

/** Tickets that need this user's attention. */
export async function getSupportTicketUnreadCount(
  userId: string,
  role: UserRole
): Promise<number> {
  if (isAdminRole(role)) {
    return prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "WAITING_ON_STAFF"] } },
    });
  }

  await ensureSupportTicketRead(userId);
  const read = await prisma.supportTicketRead.findUnique({
    where: { userId },
    select: { lastReadAt: true },
  });

  return prisma.supportTicket.count({
    where: {
      requesterId: userId,
      status: { not: "CLOSED" },
      OR: [
        { status: "WAITING_ON_MEMBER" },
        { lastActivityAt: { gt: read?.lastReadAt ?? new Date(0) } },
      ],
    },
  });
}

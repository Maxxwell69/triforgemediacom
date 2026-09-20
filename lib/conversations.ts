import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { isAdminRole } from "@/lib/rbac";
import { getMemberDisplayName } from "@/lib/memberDisplay";

export const CONVERSATION_PURPOSE = "OUTREACH";

export function requireConversationsModule() {
  if (!hubHas("conversations")) notFound();
}

const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profile: { select: { showRealName: true, socialLinks: true, username: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export type ConversationStatusFilter = "open" | "closed" | "all";

export async function listOutreachConversations(opts: {
  q?: string;
  adminId?: string;
  status?: ConversationStatusFilter;
  take?: number;
}) {
  const q = opts.q?.trim();
  const status = opts.status || "open";
  const conversations = await prisma.directConversation.findMany({
    where: {
      purpose: CONVERSATION_PURPOSE,
      archivedAt: null,
      ...(status === "open" ? { closedAt: null } : {}),
      ...(status === "closed" ? { closedAt: { not: null } } : {}),
      ...(opts.adminId
        ? { messages: { some: { staffSenderId: opts.adminId } } }
        : {}),
      ...(q
        ? {
            participants: {
              some: {
                user: {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: opts.take ?? 80,
    include: {
      closedBy: { select: { id: true, name: true, email: true } },
      participants: {
        include: { user: { select: memberSelect } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          content: true,
          createdAt: true,
          userId: true,
          staffSenderId: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  return conversations.map((c) => {
    const last = c.messages[0] ?? null;
    const lastStaff = c.messages.find((m) => m.staffSenderId) ?? null;
    const people = c.participants.map((p) => ({
      id: p.user.id,
      name: getMemberDisplayName(p.user),
      email: p.user.email,
      role: p.user.role,
    }));
    return {
      id: c.id,
      updatedAt: c.updatedAt,
      closedAt: c.closedAt,
      closedByName: c.closedBy ? c.closedBy.name || c.closedBy.email : null,
      lastPreview: last?.content ?? "",
      lastAt: last?.createdAt ?? c.updatedAt,
      lastStaffName: lastStaff
        ? lastStaff.user.name || lastStaff.user.email || "Staff"
        : null,
      lastStaffId: lastStaff?.staffSenderId ?? null,
      people,
    };
  });
}

export async function searchConversationMembers(q: string, excludeUserId: string) {
  const query = q.trim();
  if (query.length < 2) return [];
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    select: memberSelect,
    orderBy: { name: "asc" },
  });
}

export async function listStaffForFilter() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "MOD"] }, status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 80,
  });
}

export async function findOrCreateOutreachConversation(staffId: string, memberId: string) {
  if (staffId === memberId) {
    throw new Error("Pick a member, not yourself.");
  }
  const member = await prisma.user.findFirst({
    where: { id: memberId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!member) throw new Error("Member not found.");

  const existing = await prisma.directConversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: staffId } } },
        { participants: { some: { userId: memberId } } },
      ],
    },
    select: {
      id: true,
      archivedAt: true,
      participants: { select: { userId: true, leftAt: true } },
    },
  });

  if (existing && existing.participants.length === 2) {
    await prisma.directConversation.update({
      where: { id: existing.id },
      data: {
        purpose: CONVERSATION_PURPOSE,
        archivedAt: null,
        archivedById: null,
        closedAt: null,
        closedById: null,
      },
    });
    await prisma.directConversationParticipant.updateMany({
      where: { conversationId: existing.id, leftAt: { not: null } },
      data: { leftAt: null, joinedAt: new Date() },
    });
    return existing.id;
  }

  const created = await prisma.directConversation.create({
    data: {
      createdById: staffId,
      purpose: CONVERSATION_PURPOSE,
      participants: {
        create: [{ userId: staffId }, { userId: memberId }],
      },
    },
    select: { id: true },
  });
  return created.id;
}

export async function setOutreachClosed(conversationId: string, staffId: string, closed: boolean) {
  const row = await prisma.directConversation.findFirst({
    where: { id: conversationId, purpose: CONVERSATION_PURPOSE },
    select: { id: true },
  });
  if (!row) throw new Error("Conversation not found.");
  await prisma.directConversation.update({
    where: { id: conversationId },
    data: closed
      ? { closedAt: new Date(), closedById: staffId }
      : { closedAt: null, closedById: null },
  });
}

export async function getOutreachConversation(conversationId: string) {
  return prisma.directConversation.findFirst({
    where: { id: conversationId, purpose: CONVERSATION_PURPOSE },
    include: {
      closedBy: { select: { id: true, name: true, email: true } },
      participants: { include: { user: { select: memberSelect } } },
    },
  });
}

export function isStaffSenderRole(role: string | null | undefined) {
  return isAdminRole(role as "ADMIN" | "MOD");
}

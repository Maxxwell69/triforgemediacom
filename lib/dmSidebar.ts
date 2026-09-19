import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";
import { getMemberAvatarUrl, getMemberDisplayName, getMemberInitial } from "@/lib/memberDisplay";
import { parseMentionSegments } from "@/lib/chatMentions";

export const DM_SIDEBAR_LIMIT = 12;

export type DmPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
  initial: string;
};

export type DmSidebarRow = {
  id: string;
  title: string;
  preview: string | null;
  unreadCount: number;
  people: DmPerson[];
};

export function hubDmAvailable() {
  return hubHas("dms") || hubHas("chat");
}

function conversationIdFromHref(href: string | null | undefined) {
  if (!href?.startsWith("/dms/")) return null;
  const id = href.slice("/dms/".length).split(/[/?#]/)[0];
  return id || null;
}

function previewContent(content: string) {
  return parseMentionSegments(content)
    .map((s) => (s.type === "mention" ? `@${s.name}` : s.value))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

const participantUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  profile: { select: { platform: true, showRealName: true, socialLinks: true } },
  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
} as const;

export async function unreadDmConversationIds(userId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.hubNotification.findMany({
      where: { userId, readAt: null, href: { startsWith: "/dms/" } },
      select: { href: true },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      const id = conversationIdFromHref(row.href);
      if (id) ids.add(id);
    }
    return ids;
  } catch (err) {
    console.error("unreadDmConversationIds failed", err);
    return new Set();
  }
}

export async function markDmNotificationsRead(userId: string, conversationId: string) {
  try {
    await prisma.hubNotification.updateMany({
      where: { userId, href: `/dms/${conversationId}`, readAt: null },
      data: { readAt: new Date() },
    });
  } catch (err) {
    console.error("markDmNotificationsRead failed", conversationId, err);
  }
}

export async function listDmSidebarRows(userId: string): Promise<DmSidebarRow[]> {
  const [conversations, unreadIds] = await Promise.all([
    prisma.directConversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      take: DM_SIDEBAR_LIMIT,
      include: {
        participants: {
          include: { user: { select: participantUserSelect } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    unreadDmConversationIds(userId),
  ]);

  return conversations.map((c) => {
    const others = c.participants.map((p) => p.user).filter((u) => u.id !== userId);
    const people = others.map((u) => ({
      id: u.id,
      name: getMemberDisplayName(u),
      avatarUrl: getMemberAvatarUrl(u),
      initial: getMemberInitial(u),
    }));
    const last = c.messages[0]?.content;
    return {
      id: c.id,
      title: people.length > 0 ? people.map((p) => p.name).join(", ") : "Direct message",
      preview: last ? previewContent(last) || null : null,
      unreadCount: unreadIds.has(c.id) ? 1 : 0,
      people,
    };
  });
}

import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canInitiateDm, isTrueAdmin } from "@/lib/dmAccess";
import { getMemberAvatarUrl, getMemberDisplayName, getMemberInitial } from "@/lib/memberDisplay";
import DmInbox from "@/components/chat/DmInbox";
import { unreadDmConversationIds } from "@/lib/dmSidebar";

export const dynamic = "force-dynamic";

export default async function DmsPage() {
  const { user } = await requireProfile();

  const conversations = isTrueAdmin(user.role)
    ? await prisma.directConversation.findMany({
        where: { archivedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                  profile: { select: { platform: true, showRealName: true, socialLinks: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      })
    : await prisma.directConversation.findMany({
        where: {
          archivedAt: null,
          participants: { some: { userId: user.id, leftAt: null } },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  role: true,
                  profile: { select: { platform: true, showRealName: true, socialLinks: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
                  tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      });

  const unreadIds = await unreadDmConversationIds(user.id);
  const rows = conversations.map((c) => {
    const others = c.participants.map((p) => p.user).filter((u) => u.id !== user.id);
    return {
      id: c.id,
      title: others.length > 0 ? others.map((u) => getMemberDisplayName(u)).join(", ") : "Direct message",
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
      participants: others.map((u) => ({
        id: u.id,
        name: getMemberDisplayName(u),
        role: u.role,
        avatarUrl: getMemberAvatarUrl(u),
        initial: getMemberInitial(u),
      })),
      unreadCount: unreadIds.has(c.id) ? 1 : 0,
    };
  });

  return (
    <main className="flex-1">
      <DmInbox
        initialConversations={rows}
        canInitiate={await canInitiateDm(user.id, user.role)}
        isAdmin={isTrueAdmin(user.role)}
      />
    </main>
  );
}

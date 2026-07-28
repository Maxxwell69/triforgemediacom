import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canInitiateDm, isTrueAdmin } from "@/lib/dmAccess";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import DmInbox from "@/components/chat/DmInbox";

export const dynamic = "force-dynamic";

export default async function DmsPage() {
  const { user } = await requireProfile();

  const conversations = isTrueAdmin(user.role)
    ? await prisma.directConversation.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profile: { select: { platform: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
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
        where: { participants: { some: { userId: user.id } } },
        orderBy: { updatedAt: "desc" },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profile: { select: { platform: true } },
                  tiktokConnection: { select: { displayName: true, avatarUrl: true } },
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
      participants: c.participants.map((p) => ({
        id: p.user.id,
        name: getMemberDisplayName(p.user),
        role: p.user.role,
      })),
    };
  });

  return (
    <main className="flex-1">
      <DmInbox
        initialConversations={rows}
        canInitiate={await canInitiateDm(user.id, user.role)}
      />
    </main>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessConversation, summarizeReactions } from "@/lib/dmAccess";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import DmChatView from "@/components/chat/DmChatView";

export const dynamic = "force-dynamic";

export default async function DmConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const { user } = await requireProfile();

  if (!(await canAccessConversation(user.id, user.role, params.conversationId))) {
    notFound();
  }

  const [conversation, dbUser, messages] = await Promise.all([
    prisma.directConversation.findUnique({
      where: { id: params.conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { platform: true, showRealName: true, socialLinks: true } },
                tiktokConnection: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { mutedUntil: true } }),
    prisma.directMessage.findMany({
      where: { conversationId: params.conversationId },
      include: {
        user: { select: { id: true, name: true, image: true, role: true, mutedUntil: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!conversation) notFound();

  const others = conversation.participants
    .map((p) => p.user)
    .filter((u) => u.id !== user.id);
  const title =
    others.length > 0
      ? others.map((u) => getMemberDisplayName(u)).join(", ")
      : "Direct message";

  const initialMessages = [...messages].reverse().map(({ reactions, ...message }) => ({
    ...message,
    reactions: summarizeReactions(reactions, user.id),
  }));

  return (
    <DmChatView
      conversationId={conversation.id}
      title={title}
      currentUserId={user.id}
      initialMessages={initialMessages}
      initialMutedUntil={dbUser?.mutedUntil ?? null}
    />
  );
}

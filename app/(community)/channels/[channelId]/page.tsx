import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { summarizeReactions } from "@/lib/dmAccess";
import ChatView from "@/components/chat/ChatView";

export default async function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const { user } = await requireProfile();

  const [channel, userGroupIds, dbUser] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: params.channelId },
      include: { groups: { select: { id: true } } },
    }),
    getUserGroupIds(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { mutedUntil: true } }),
  ]);
  if (!channel || !canAccessChannel(user.role, channel, userGroupIds)) {
    notFound();
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    include: {
      user: { select: { id: true, name: true, image: true, role: true, mutedUntil: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const initialMessages = [...messages].reverse().map(({ reactions, ...message }) => ({
    ...message,
    reactions: summarizeReactions(reactions, user.id),
  }));

  return (
    <ChatView
      channel={{ id: channel.id, name: channel.name, description: channel.description }}
      currentUserId={user.id}
      currentUserRole={user.role}
      initialMessages={initialMessages}
      initialMutedUntil={dbUser?.mutedUntil ?? null}
    />
  );
}

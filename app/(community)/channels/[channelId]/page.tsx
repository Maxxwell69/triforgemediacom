import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { canAccessChannel, getHomeGroup, getUserGroupIds } from "@/lib/groups";
import { summarizeReactions } from "@/lib/dmAccess";
import { chatAuthorSelect } from "@/lib/memberDisplay";
import { toChatAuthor } from "@/lib/chatAuthors";
import { markChannelRead } from "@/lib/channelReads";
import { replyToInclude } from "@/lib/chatReplies";
import ChatView from "@/components/chat/ChatView";
import SyncActiveGroup from "@/components/groups/SyncActiveGroup";
import {
  ACTIVE_GROUP_COOKIE,
  inferGroupIdForChannel,
} from "@/lib/activeGroup";

export default async function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const { user } = await requireProfile();
  const currentActiveId = cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? null;

  const [channel, userGroupIds, dbUser, homeGroup] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: params.channelId },
      include: { groups: { select: { id: true, isHome: true } } },
    }),
    getUserGroupIds(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { mutedUntil: true } }),
    getHomeGroup(),
  ]);
  if (!channel || !canAccessChannel(user.role, channel, userGroupIds)) {
    notFound();
  }

  // Only sync when the open channel isn't in the current space (e.g. deep link).
  const channelInActiveSpace =
    !!currentActiveId &&
    (channel.groups.some((g) => g.id === currentActiveId) ||
      (homeGroup?.id === currentActiveId && channel.groups.length === 0));
  const syncGroupId = channelInActiveSpace
    ? null
    : inferGroupIdForChannel(channel.groups, currentActiveId, homeGroup?.id ?? null);

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    include: {
      user: { select: chatAuthorSelect },
      reactions: { select: { emoji: true, userId: true } },
      replyTo: replyToInclude,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  await markChannelRead(user.id, channel.id);

  const initialMessages = [...messages].reverse().map(
    ({ reactions, user: author, replyTo, ...message }) => ({
      ...message,
      user: toChatAuthor(author),
      reactions: summarizeReactions(reactions, user.id),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            user: toChatAuthor(replyTo.user),
          }
        : null,
    })
  );

  return (
    <>
      {syncGroupId ? (
        <SyncActiveGroup groupId={syncGroupId} currentActiveId={currentActiveId} />
      ) : null}
      <ChatView
        channel={{ id: channel.id, name: channel.name, description: channel.description }}
        currentUserId={user.id}
        currentUserRole={user.role}
        initialMessages={initialMessages}
        initialMutedUntil={dbUser?.mutedUntil ?? null}
      />
    </>
  );
}

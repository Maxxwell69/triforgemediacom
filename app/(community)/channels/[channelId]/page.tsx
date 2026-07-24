import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { meetsMinRole } from "@/lib/rbac";
import ChatView from "@/components/chat/ChatView";

export default async function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const { user } = await requireProfile();

  const channel = await prisma.channel.findUnique({ where: { id: params.channelId } });
  if (!channel || !meetsMinRole(user.role, channel.minRole)) {
    notFound();
  }

  const messages = await prisma.message.findMany({
    where: { channelId: channel.id },
    include: { user: { select: { id: true, name: true, image: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const initialMessages = [...messages].reverse();

  return (
    <ChatView
      channel={{ id: channel.id, name: channel.name, description: channel.description }}
      currentUserId={user.id}
      initialMessages={initialMessages}
    />
  );
}

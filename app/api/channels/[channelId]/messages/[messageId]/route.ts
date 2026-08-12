import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { canModerate } from "@/lib/moderation";
import { deleteMessageSchema } from "@/lib/validations/moderation";
import { editMessageSchema } from "@/lib/validations/message";
import { summarizeReactions } from "@/lib/dmAccess";
import { chatAuthorSelect } from "@/lib/memberDisplay";
import { toChatAuthor } from "@/lib/chatAuthors";
import { replyToInclude } from "@/lib/chatReplies";

const messageInclude = {
  user: { select: chatAuthorSelect },
  reactions: { select: { emoji: true, userId: true } },
  replyTo: replyToInclude,
} as const;

async function getAccessibleChannel(channelId: string, userId: string, userRole: UserRole) {
  const [channel, userGroupIds] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      include: { groups: { select: { id: true, isHome: true } } },
    }),
    getUserGroupIds(userId),
  ]);
  if (!channel) return null;
  if (!canAccessChannel(userRole, channel, userGroupIds)) return null;
  return channel;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { channelId: string; messageId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const channel = await getAccessibleChannel(params.channelId, result.user.id, result.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const existing = await prisma.message.findUnique({
    where: { id: params.messageId },
  });
  if (!existing || existing.channelId !== params.channelId) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (existing.userId !== result.user.id) {
    return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = editMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid message" },
      { status: 400 }
    );
  }

  if (!parsed.data.content && !existing.imageUrl) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  if (parsed.data.content === existing.content) {
    const unchanged = await prisma.message.findUnique({
      where: { id: existing.id },
      include: messageInclude,
    });
    if (!unchanged) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    const { reactions, user, replyTo, ...rest } = unchanged;
    return NextResponse.json({
      message: {
        ...rest,
        user: toChatAuthor(user),
        reactions: summarizeReactions(reactions, result.user.id),
        replyTo: replyTo
          ? {
              id: replyTo.id,
              content: replyTo.content,
              imageUrl: replyTo.imageUrl,
              user: toChatAuthor(replyTo.user),
            }
          : null,
      },
    });
  }

  const message = await prisma.message.update({
    where: { id: existing.id },
    data: {
      content: parsed.data.content,
      editedAt: new Date(),
    },
    include: messageInclude,
  });

  const { reactions, user, replyTo, ...rest } = message;
  return NextResponse.json({
    message: {
      ...rest,
      user: toChatAuthor(user),
      reactions: summarizeReactions(reactions, result.user.id),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            content: replyTo.content,
            imageUrl: replyTo.imageUrl,
            user: toChatAuthor(replyTo.user),
          }
        : null,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { channelId: string; messageId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.messageId },
  });
  if (!message || message.channelId !== params.channelId) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const isAuthor = message.userId === result.user.id;
  const isModerator = canModerate(result.user.role);
  if (!isAuthor && !isModerator) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let reason: string | undefined;
  try {
    const body = await req.json();
    const parsed = deleteMessageSchema.safeParse(body);
    if (parsed.success) reason = parsed.data.reason || undefined;
  } catch {
    // No body provided is fine — reason is optional.
  }

  await prisma.message.delete({ where: { id: message.id } });

  if (isModerator && !isAuthor) {
    await prisma.moderationAction.create({
      data: {
        type: "MESSAGE_DELETED",
        moderatorId: result.user.id,
        targetUserId: message.userId,
        channelId: message.channelId,
        messageSnapshot: message.content,
        reason: reason || null,
      },
    });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessChannel, getUserGroupIds } from "@/lib/groups";
import { isAllowedReactionEmoji } from "@/lib/chatEmoji";
import { summarizeReactions } from "@/lib/dmAccess";
import { z } from "zod";

const bodySchema = z.object({
  emoji: z.string().trim().min(1).max(16),
});

async function assertChannelAccess(channelId: string, userId: string, role: UserRole) {
  const [channel, userGroupIds] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: channelId },
      include: { groups: { select: { id: true } } },
    }),
    getUserGroupIds(userId),
  ]);
  if (!channel || !canAccessChannel(role, channel, userGroupIds)) return null;
  return channel;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string; messageId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const channel = await assertChannelAccess(params.channelId, result.user.id, result.user.role);
  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const message = await prisma.message.findFirst({
    where: { id: params.messageId, channelId: channel.id },
    select: { id: true },
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isAllowedReactionEmoji(parsed.data.emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId: message.id,
        userId: result.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({
      data: {
        messageId: message.id,
        userId: result.user.id,
        emoji: parsed.data.emoji,
      },
    });
  }

  const reactions = await prisma.messageReaction.findMany({
    where: { messageId: message.id },
    select: { emoji: true, userId: true },
  });

  return NextResponse.json({
    reactions: summarizeReactions(reactions, result.user.id),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessConversation, summarizeReactions } from "@/lib/dmAccess";
import { isAllowedReactionEmoji } from "@/lib/chatEmoji";
import { z } from "zod";

const bodySchema = z.object({
  emoji: z.string().trim().min(1).max(16),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } }
) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canAccessConversation(result.user.id, result.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = await prisma.directMessage.findFirst({
    where: { id: params.messageId, conversationId: params.conversationId },
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

  const existing = await prisma.directMessageReaction.findUnique({
    where: {
      directMessageId_userId_emoji: {
        directMessageId: message.id,
        userId: result.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.directMessageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.directMessageReaction.create({
      data: {
        directMessageId: message.id,
        userId: result.user.id,
        emoji: parsed.data.emoji,
      },
    });
  }

  const reactions = await prisma.directMessageReaction.findMany({
    where: { directMessageId: message.id },
    select: { emoji: true, userId: true },
  });

  return NextResponse.json({
    reactions: summarizeReactions(reactions, result.user.id),
  });
}

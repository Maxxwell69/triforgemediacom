import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canModerate } from "@/lib/moderation";
import { deleteMessageSchema } from "@/lib/validations/moderation";

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

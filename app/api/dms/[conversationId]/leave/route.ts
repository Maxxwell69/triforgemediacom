import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessConversation } from "@/lib/dmAccess";

export async function POST(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  if (!(await canAccessConversation(auth.user.id, auth.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.directConversationParticipant.updateMany({
    where: { conversationId: params.conversationId, userId: auth.user.id },
    data: { leftAt: new Date() },
  });
  await prisma.hubNotification.updateMany({
    where: { userId: auth.user.id, href: `/dms/${params.conversationId}`, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

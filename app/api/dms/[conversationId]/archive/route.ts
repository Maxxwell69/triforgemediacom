import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canAccessConversation } from "@/lib/dmAccess";
import { isAdminRole } from "@/lib/rbac";

export async function POST(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }
  if (!isAdminRole(auth.user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!(await canAccessConversation(auth.user.id, auth.user.role, params.conversationId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.directConversation.update({
    where: { id: params.conversationId },
    data: { archivedAt: new Date(), archivedById: auth.user.id },
  });

  return NextResponse.json({ ok: true });
}

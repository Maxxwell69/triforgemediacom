import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFreshSessionUser } from "@/lib/session";
import { canModerate, canBeModerationTarget } from "@/lib/moderation";

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const user = await getFreshSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (!canModerate(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!canBeModerationTarget(targetUser.role)) {
    return NextResponse.json({ error: "Can't unmute a mod or admin" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUser.id }, data: { mutedUntil: null } }),
    prisma.moderationAction.create({
      data: {
        type: "USER_UNMUTED",
        moderatorId: user.id,
        targetUserId: targetUser.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canModerate, canBeModerationTarget, DEFAULT_MUTE_DURATION_MINUTES } from "@/lib/moderation";
import { muteSchema } from "@/lib/validations/moderation";

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (!canModerate(session.user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!canBeModerationTarget(targetUser.role)) {
    return NextResponse.json({ error: "Can't mute a mod or admin" }, { status: 403 });
  }

  let durationMinutes = DEFAULT_MUTE_DURATION_MINUTES;
  try {
    const body = await req.json();
    const parsed = muteSchema.safeParse(body);
    if (parsed.success && parsed.data.durationMinutes) {
      durationMinutes = parsed.data.durationMinutes;
    }
  } catch {
    // No body provided — fall back to the default duration.
  }

  const mutedUntil = new Date(Date.now() + durationMinutes * 60_000);

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetUser.id }, data: { mutedUntil } }),
    prisma.moderationAction.create({
      data: {
        type: "USER_MUTED",
        moderatorId: session.user.id,
        targetUserId: targetUser.id,
        reason: `Muted for ${durationMinutes} minutes`,
      },
    }),
  ]);

  return NextResponse.json({ mutedUntil });
}

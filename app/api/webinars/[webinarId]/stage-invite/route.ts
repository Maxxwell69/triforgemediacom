import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isLiveKitConfigured, setParticipantPublish } from "@/lib/livekit";
import { isWebinarHost } from "@/lib/webinars";
import { stageInviteSchema } from "@/lib/validations/webinar";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const webinar = await prisma.webinar.findUnique({ where: { id: params.webinarId } });
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!isWebinarHost(webinar, auth.user.id, auth.user.role)) {
    return NextResponse.json({ error: "Only the host can invite to stage." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = stageInviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { userId, approve } = parsed.data;

  if (approve) {
    await prisma.webinarAttendance.upsert({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      create: {
        webinarId: webinar.id,
        userId,
        role: "SPEAKER",
        forcedAudience: false,
        kickedAt: null,
      },
      update: {
        role: "SPEAKER",
        leftAt: null,
        forcedAudience: false,
        kickedAt: null,
      },
    });

    await prisma.webinarStageRequest.upsert({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      create: {
        webinarId: webinar.id,
        userId,
        status: "APPROVED",
        resolvedAt: new Date(),
      },
      update: { status: "APPROVED", resolvedAt: new Date() },
    });

    if (isLiveKitConfigured()) {
      try {
        await setParticipantPublish({
          roomName: webinar.livekitRoomName,
          identity: userId,
          canPublish: true,
          metadata: JSON.stringify({ role: "speaker" }),
        });
      } catch {
        // Participant may not be connected yet — token refresh will grant publish.
      }
    }
  } else {
    await prisma.webinarStageRequest.updateMany({
      where: { webinarId: webinar.id, userId, status: "PENDING" },
      data: { status: "DENIED", resolvedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}

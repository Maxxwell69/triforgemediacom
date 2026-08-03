import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import {
  buildWebinarParticipantMeta,
  isLiveKitConfigured,
  setParticipantPublish,
} from "@/lib/livekit";
import { getAttendanceAvatarUrl, isWebinarHost } from "@/lib/webinars";
import { parseWebinarGuestId, webinarGuestIdentity } from "@/lib/webinarExternal";
import { stageInviteSchema } from "@/lib/validations/webinar";

export const dynamic = "force-dynamic";

async function grantPublish(
  roomName: string,
  identity: string,
  avatarUrl?: string | null
) {
  if (!isLiveKitConfigured()) return;
  try {
    await setParticipantPublish({
      roomName,
      identity,
      canPublish: true,
      metadata: buildWebinarParticipantMeta({ role: "speaker", avatarUrl }),
    });
  } catch {
    // Participant may not be connected yet — token refresh will grant publish.
  }
}

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
  const guestId = parseWebinarGuestId(userId);

  if (guestId) {
    const guest = await prisma.webinarGuest.findFirst({
      where: { id: guestId, webinarId: webinar.id },
      select: { id: true },
    });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    if (approve) {
      await prisma.webinarGuest.update({
        where: { id: guest.id },
        data: {
          role: "SPEAKER",
          forcedAudience: false,
          kickedAt: null,
          stageRequestStatus: "APPROVED",
          stageRequestedAt: null,
        },
      });
      await grantPublish(webinar.livekitRoomName, webinarGuestIdentity(guest.id));
    } else {
      await prisma.webinarGuest.update({
        where: { id: guest.id },
        data: {
          stageRequestStatus: "DENIED",
          stageRequestedAt: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  }

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

    const avatarUrl = await getAttendanceAvatarUrl(webinar.id, userId);
    await grantPublish(webinar.livekitRoomName, userId, avatarUrl);
  } else {
    await prisma.webinarStageRequest.updateMany({
      where: { webinarId: webinar.id, userId, status: "PENDING" },
      data: { status: "DENIED", resolvedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import {
  buildWebinarParticipantMeta,
  isLiveKitConfigured,
  removeParticipant,
  setParticipantPublish,
  type WebinarTokenRole,
} from "@/lib/livekit";
import { canModerateWebinar, getAttendanceAvatarUrl } from "@/lib/webinars";
import { webinarModerateSchema } from "@/lib/validations/webinar";

export const dynamic = "force-dynamic";

async function stageMetadata(
  webinarId: string,
  userId: string,
  role: WebinarTokenRole
) {
  const avatarUrl = await getAttendanceAvatarUrl(webinarId, userId);
  return buildWebinarParticipantMeta({ role, avatarUrl });
}

async function revokeStage(roomName: string, webinarId: string, userId: string) {
  if (!isLiveKitConfigured()) return;
  try {
    await setParticipantPublish({
      roomName,
      identity: userId,
      canPublish: false,
      metadata: await stageMetadata(webinarId, userId, "audience"),
    });
  } catch {
    // Participant may already be disconnected.
  }
}

async function grantStage(
  roomName: string,
  webinarId: string,
  userId: string,
  asHost: boolean
) {
  if (!isLiveKitConfigured()) return;
  try {
    await setParticipantPublish({
      roomName,
      identity: userId,
      canPublish: true,
      metadata: await stageMetadata(
        webinarId,
        userId,
        asHost ? "host" : "speaker"
      ),
    });
  } catch {
    // Token remint / reconnect will pick up role.
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

  if (!(await canModerateWebinar(webinar, auth.user.id, auth.user.role))) {
    return NextResponse.json({ error: "Only hosts can moderate." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = webinarModerateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { action, userId, messageId, durationMinutes } = parsed.data;

  if (action !== "clear_chat" && action !== "delete_message") {
    if (!userId || userId === auth.user.id) {
      return NextResponse.json({ error: "Pick someone else." }, { status: 400 });
    }
  }

  if (action === "delete_message") {
    if (!messageId) {
      return NextResponse.json({ error: "Message id required." }, { status: 400 });
    }
    const message = await prisma.webinarChatMessage.findFirst({
      where: { id: messageId, webinarId: webinar.id, deletedAt: null },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    await prisma.webinarChatMessage.update({
      where: { id: message.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true, removedId: message.id });
  }

  if (action === "clear_chat") {
    await prisma.webinarChatMessage.updateMany({
      where: { webinarId: webinar.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true, cleared: true });
  }

  // Remaining actions require a target user.
  if (!userId) {
    return NextResponse.json({ error: "User id required." }, { status: 400 });
  }

  if (action === "invite_stage") {
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
    await grantStage(webinar.livekitRoomName, webinar.id, userId, false);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove_stage") {
    await prisma.webinarAttendance.upsert({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      create: {
        webinarId: webinar.id,
        userId,
        role: "AUDIENCE",
        forcedAudience: true,
      },
      update: { role: "AUDIENCE", forcedAudience: true },
    });
    await revokeStage(webinar.livekitRoomName, webinar.id, userId);
    return NextResponse.json({ ok: true });
  }

  if (action === "demote_host") {
    if (userId === webinar.hostUserId) {
      return NextResponse.json(
        { error: "Can't remove the designated webinar host from host." },
        { status: 403 }
      );
    }
    const target = await prisma.webinarAttendance.findUnique({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      select: { role: true },
    });
    if (target?.role !== "HOST") {
      return NextResponse.json({ error: "That person is not a session host." }, { status: 400 });
    }
    await prisma.webinarAttendance.update({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      data: { role: "AUDIENCE", forcedAudience: true },
    });
    await revokeStage(webinar.livekitRoomName, webinar.id, userId);
    return NextResponse.json({ ok: true });
  }

  if (action === "kick") {
    if (userId === webinar.hostUserId) {
      return NextResponse.json({ error: "Can't kick the designated webinar host." }, { status: 403 });
    }
    await prisma.webinarAttendance.upsert({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      create: {
        webinarId: webinar.id,
        userId,
        role: "AUDIENCE",
        forcedAudience: true,
        kickedAt: new Date(),
        leftAt: new Date(),
      },
      update: {
        role: "AUDIENCE",
        forcedAudience: true,
        kickedAt: new Date(),
        leftAt: new Date(),
      },
    });
    await revokeStage(webinar.livekitRoomName, webinar.id, userId);
    if (isLiveKitConfigured()) {
      try {
        await removeParticipant({ roomName: webinar.livekitRoomName, identity: userId });
      } catch {
        // Already gone.
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "mute_chat") {
    const minutes = durationMinutes && durationMinutes > 0 ? durationMinutes : 60 * 24;
    const chatMutedUntil = new Date(Date.now() + minutes * 60_000);
    await prisma.webinarAttendance.upsert({
      where: { webinarId_userId: { webinarId: webinar.id, userId } },
      create: {
        webinarId: webinar.id,
        userId,
        role: "AUDIENCE",
        chatMutedUntil,
      },
      update: { chatMutedUntil },
    });
    return NextResponse.json({ ok: true, chatMutedUntil: chatMutedUntil.toISOString() });
  }

  if (action === "unmute_chat") {
    await prisma.webinarAttendance.updateMany({
      where: { webinarId: webinar.id, userId },
      data: { chatMutedUntil: null },
    });
    return NextResponse.json({ ok: true, chatMutedUntil: null });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

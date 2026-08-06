import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isLiveKitConfigured, mintWebinarToken, getLiveKitUrl } from "@/lib/livekit";
import { getMemberAvatarUrl } from "@/lib/memberDisplay";
import { getUserNetworkTrack } from "@/lib/mnCn";
import {
  canJoinWebinar,
  canViewWebinar,
  displayNameForUser,
  isWebinarHost,
  resolveParticipantRole,
  roleToTokenRole,
  upsertAttendance,
  type WebinarJoinMode,
} from "@/lib/webinars";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["host", "watch"]).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "LiveKit is not configured on this server." },
      { status: 503 }
    );
  }

  let joinMode: WebinarJoinMode | undefined;
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) joinMode = parsed.data.mode;
  } catch {
    // empty body is fine
  }

  const [webinar, networkTrack] = await Promise.all([
    prisma.webinar.findUnique({
      where: { id: params.webinarId },
    }),
    getUserNetworkTrack(auth.user.id),
  ]);

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canViewWebinar(webinar, auth.user.role, auth.user.id, networkTrack)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canJoinWebinar(webinar.status)) {
    return NextResponse.json(
      {
        error:
          webinar.status === "ENDED"
            ? "This webinar has ended."
            : "This webinar is not open yet.",
      },
      { status: 403 }
    );
  }

  if (joinMode === "host" && !isWebinarHost(webinar, auth.user.id, auth.user.role)) {
    return NextResponse.json({ error: "Not authorized to join as host." }, { status: 403 });
  }

  const existingAttendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
    select: { kickedAt: true },
  });
  if (existingAttendance?.kickedAt) {
    return NextResponse.json(
      { error: "You've been removed from this webinar." },
      { status: 403 }
    );
  }

  const role = await resolveParticipantRole(
    webinar,
    auth.user.id,
    auth.user.role,
    joinMode
  );
  await upsertAttendance(webinar.id, auth.user.id, role);

  const identity = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      name: true,
      email: true,
      profile: { select: { socialLinks: true, username: true } },
      tiktokConnection: { select: { displayName: true, avatarUrl: true } },
      tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
    },
  });
  const name = displayNameForUser(identity ?? auth.user);

  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
    select: { avatarUrl: true },
  });
  const avatarUrl =
    attendance?.avatarUrl ||
    (identity ? getMemberAvatarUrl(identity) : null) ||
    null;

  // Seed TikTok/profile avatar into attendance once so it sticks for the session.
  if (!attendance?.avatarUrl && avatarUrl) {
    await prisma.webinarAttendance.update({
      where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
      data: { avatarUrl },
    });
  }

  const token = await mintWebinarToken({
    identity: auth.user.id,
    name,
    roomName: webinar.livekitRoomName,
    role: roleToTokenRole(role),
    avatarUrl,
  });

  return NextResponse.json({
    token,
    url: getLiveKitUrl(),
    roomName: webinar.livekitRoomName,
    role,
    avatarUrl,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isLiveKitConfigured, mintWebinarToken, getLiveKitUrl } from "@/lib/livekit";
import {
  canJoinWebinar,
  canViewWebinar,
  displayNameForUser,
  resolveParticipantRole,
  roleToTokenRole,
  upsertAttendance,
} from "@/lib/webinars";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
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

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canViewWebinar(webinar.status, auth.user.role, webinar.hostUserId, auth.user.id)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canJoinWebinar(webinar.status)) {
    return NextResponse.json(
      { error: webinar.status === "ENDED" ? "This webinar has ended." : "This webinar is not open yet." },
      { status: 403 }
    );
  }

  const role = await resolveParticipantRole(webinar, auth.user.id, auth.user.role);
  await upsertAttendance(webinar.id, auth.user.id, role);

  const name = displayNameForUser(auth.user);
  const token = await mintWebinarToken({
    identity: auth.user.id,
    name,
    roomName: webinar.livekitRoomName,
    role: roleToTokenRole(role),
  });

  return NextResponse.json({
    token,
    url: getLiveKitUrl(),
    roomName: webinar.livekitRoomName,
    role,
  });
}

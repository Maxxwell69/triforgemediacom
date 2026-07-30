import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isLiveKitConfigured, mintWebinarToken, getLiveKitUrl } from "@/lib/livekit";
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

  const role = await resolveParticipantRole(
    webinar,
    auth.user.id,
    auth.user.role,
    joinMode
  );
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

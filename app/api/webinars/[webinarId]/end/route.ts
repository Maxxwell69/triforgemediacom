import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isWebinarHost } from "@/lib/webinars";

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

  const webinar = await prisma.webinar.findUnique({ where: { id: params.webinarId } });
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!isWebinarHost(webinar, auth.user.id, auth.user.role)) {
    return NextResponse.json({ error: "Only the host can end this webinar." }, { status: 403 });
  }

  const updated = await prisma.webinar.update({
    where: { id: webinar.id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  await prisma.webinarAttendance.updateMany({
    where: { webinarId: webinar.id },
    data: {
      leftAt: new Date(),
      forcedAudience: false,
      chatMutedUntil: null,
      kickedAt: null,
    },
  });

  await prisma.webinarGuest.updateMany({
    where: { webinarId: webinar.id },
    data: {
      role: "AUDIENCE",
      forcedAudience: false,
      stageRequestStatus: null,
      stageRequestedAt: null,
    },
  });

  return NextResponse.json({ webinar: updated });
}

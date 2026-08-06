import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { canViewWebinar } from "@/lib/webinars";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { webinarId: string } }
) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const networkTrack = await getUserNetworkTrack(auth.user.id);

  const webinar = await prisma.webinar.findUnique({
    where: { id: params.webinarId },
    include: {
      host: { select: { id: true, name: true, email: true, image: true } },
      _count: { select: { attendances: true } },
      stageRequests: {
        where: { status: "PENDING" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canViewWebinar(webinar, auth.user.role, auth.user.id, networkTrack)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ webinar });
}

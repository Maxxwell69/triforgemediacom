import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
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

  if (!canViewWebinar(webinar.status, auth.user.role, webinar.hostUserId, auth.user.id)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ webinar });
}

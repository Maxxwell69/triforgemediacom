import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canJoinWebinar, isWebinarHost } from "@/lib/webinars";

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

  const webinar = await prisma.webinar.findUnique({ where: { id: params.webinarId } });
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!isWebinarHost(webinar, auth.user.id, auth.user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const requests = await prisma.webinarStageRequest.findMany({
    where: { webinarId: webinar.id, status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ requests });
}

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

  if (!canJoinWebinar(webinar.status)) {
    return NextResponse.json({ error: "Webinar is not open." }, { status: 403 });
  }

  // Use attendance role (how they joined this session), not staff capability —
  // admins in watch mode are audience and must be able to raise their hand.
  const existing = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
  });
  if (existing?.role === "HOST") {
    return NextResponse.json({ error: "Host is already on stage." }, { status: 400 });
  }
  if (existing?.role === "SPEAKER") {
    return NextResponse.json({ error: "You are already on stage." }, { status: 400 });
  }

  const request = await prisma.webinarStageRequest.upsert({
    where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
    create: {
      webinarId: webinar.id,
      userId: auth.user.id,
      status: "PENDING",
    },
    update: {
      status: "PENDING",
      resolvedAt: null,
      createdAt: new Date(),
    },
  });

  return NextResponse.json({ request });
}

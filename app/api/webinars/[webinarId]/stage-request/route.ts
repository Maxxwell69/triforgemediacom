import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { canJoinWebinar, canViewWebinar, isWebinarHost } from "@/lib/webinars";
import { webinarGuestIdentity } from "@/lib/webinarExternal";

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

  const [memberRequests, guestRequests] = await Promise.all([
    prisma.webinarStageRequest.findMany({
      where: { webinarId: webinar.id, status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.webinarGuest.findMany({
      where: {
        webinarId: webinar.id,
        stageRequestStatus: "PENDING",
        kickedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        stageRequestedAt: true,
      },
      orderBy: { stageRequestedAt: "asc" },
    }),
  ]);

  const requests = [
    ...memberRequests.map((r) => ({
      id: r.id,
      user: r.user,
      createdAt: r.createdAt,
    })),
    ...guestRequests.map((g) => ({
      id: `guest_${g.id}`,
      user: {
        id: webinarGuestIdentity(g.id),
        name: g.name,
        email: g.email,
        image: null as string | null,
      },
      createdAt: g.stageRequestedAt,
    })),
  ].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return at - bt;
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

  const [webinar, networkTrack] = await Promise.all([
    prisma.webinar.findUnique({ where: { id: params.webinarId } }),
    getUserNetworkTrack(auth.user.id),
  ]);
  if (!webinar || !canViewWebinar(webinar, auth.user.role, auth.user.id, networkTrack)) {
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

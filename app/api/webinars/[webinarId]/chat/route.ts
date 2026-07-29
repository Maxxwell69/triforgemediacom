import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { canJoinWebinar, canViewWebinar, displayNameForUser } from "@/lib/webinars";
import { chatMessageSchema } from "@/lib/validations/webinar";

export const dynamic = "force-dynamic";

export async function GET(
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

  if (!canViewWebinar(webinar.status, auth.user.role, webinar.hostUserId, auth.user.id)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.webinarChatMessage.findMany({
    where: {
      webinarId: webinar.id,
      ...(after
        ? { createdAt: { gt: new Date(after) } }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    take: after ? 100 : 100,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      user: {
        id: m.user.id,
        name: displayNameForUser(m.user),
        image: m.user.image,
      },
    })),
  });
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

  if (!canViewWebinar(webinar.status, auth.user.role, webinar.hostUserId, auth.user.id)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canJoinWebinar(webinar.status) && webinar.status !== "ENDED") {
    return NextResponse.json({ error: "Chat is closed." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = chatMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid message" },
      { status: 400 }
    );
  }

  const message = await prisma.webinarChatMessage.create({
    data: {
      webinarId: webinar.id,
      userId: auth.user.id,
      body: parsed.data.body,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      user: {
        id: message.user.id,
        name: displayNameForUser(message.user),
        image: message.user.image,
      },
    },
  });
}

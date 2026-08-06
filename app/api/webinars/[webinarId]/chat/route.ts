import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { isMuted } from "@/lib/moderation";
import { getUserNetworkTrack } from "@/lib/mnCn";
import {
  canJoinWebinar,
  canViewWebinar,
  isWebinarChatMuted,
} from "@/lib/webinars";
import { chatMessageSchema } from "@/lib/validations/webinar";
import {
  serializeWebinarChatAuthor,
  webinarChatAuthorSelect,
  webinarChatGuestSelect,
} from "@/lib/webinarChat";

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

  const [webinar, networkTrack] = await Promise.all([
    prisma.webinar.findUnique({ where: { id: params.webinarId } }),
    getUserNetworkTrack(auth.user.id),
  ]);
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canViewWebinar(webinar, auth.user.role, auth.user.id, networkTrack)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");
  const afterDate = after ? new Date(after) : null;

  const messages = await prisma.webinarChatMessage.findMany({
    where: {
      webinarId: webinar.id,
      deletedAt: null,
      ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: webinarChatAuthorSelect },
      guest: { select: webinarChatGuestSelect },
    },
  });

  let removedIds: string[] = [];
  if (afterDate) {
    const removed = await prisma.webinarChatMessage.findMany({
      where: {
        webinarId: webinar.id,
        deletedAt: { gt: afterDate },
      },
      select: { id: true },
      take: 200,
    });
    removedIds = removed.map((m) => m.id);
  }

  const attendance = await prisma.webinarAttendance.findUnique({
    where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
    select: { chatMutedUntil: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      user: serializeWebinarChatAuthor(m.user, m.guest),
    })),
    removedIds,
    chatMutedUntil: attendance?.chatMutedUntil?.toISOString() ?? null,
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

  const [webinar, networkTrack] = await Promise.all([
    prisma.webinar.findUnique({ where: { id: params.webinarId } }),
    getUserNetworkTrack(auth.user.id),
  ]);
  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canViewWebinar(webinar, auth.user.role, auth.user.id, networkTrack)) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  if (!canJoinWebinar(webinar.status) && webinar.status !== "ENDED") {
    return NextResponse.json({ error: "Chat is closed." }, { status: 403 });
  }

  const [freshUser, attendance] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { mutedUntil: true },
    }),
    prisma.webinarAttendance.findUnique({
      where: { webinarId_userId: { webinarId: webinar.id, userId: auth.user.id } },
      select: { chatMutedUntil: true, kickedAt: true },
    }),
  ]);

  if (attendance?.kickedAt) {
    return NextResponse.json({ error: "You've been removed from this webinar." }, { status: 403 });
  }

  if (freshUser && isMuted(freshUser)) {
    return NextResponse.json({ error: "You are muted and can't chat right now." }, { status: 403 });
  }

  if (isWebinarChatMuted(attendance)) {
    return NextResponse.json(
      { error: "You've been muted in this webinar chat." },
      { status: 403 }
    );
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
      user: { select: webinarChatAuthorSelect },
      guest: { select: webinarChatGuestSelect },
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      user: serializeWebinarChatAuthor(message.user, message.guest),
    },
  });
}

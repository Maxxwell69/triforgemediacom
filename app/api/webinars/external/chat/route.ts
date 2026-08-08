import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canJoinWebinar } from "@/lib/webinars";
import { chatMessageSchema } from "@/lib/validations/webinar";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  serializeWebinarChatAuthor,
  webinarChatAuthorSelect,
  webinarChatGuestSelect,
} from "@/lib/webinarChat";

export const dynamic = "force-dynamic";

const joinTokenSchema = z.object({
  joinToken: z.string().min(16).max(128),
});

async function loadGuest(joinToken: string) {
  return prisma.webinarGuest.findUnique({
    where: { joinToken },
    include: {
      webinar: {
        select: {
          id: true,
          status: true,
          externalSignupEnabled: true,
        },
      },
    },
  });
}


/** Outside guests: read webinar chat (no hub session). */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(`webinar-guest-chat-get:${ip}`, 120, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = joinTokenSchema.safeParse({ joinToken: searchParams.get("joinToken") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid join token." }, { status: 400 });
  }

  const guest = await loadGuest(parsed.data.joinToken);
  if (!guest) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  if (guest.kickedAt) {
    return NextResponse.json(
      { error: "You've been removed from this webinar." },
      { status: 403 }
    );
  }

  const after = searchParams.get("after");
  const afterDate = after ? new Date(after) : null;

  const messages = await prisma.webinarChatMessage.findMany({
    where: {
      webinarId: guest.webinar.id,
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
        webinarId: guest.webinar.id,
        deletedAt: { gt: afterDate },
      },
      select: { id: true },
      take: 200,
    });
    removedIds = removed.map((m) => m.id);
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      user: serializeWebinarChatAuthor(m.user, m.guest),
    })),
    removedIds,
    chatMutedUntil: guest.chatMutedUntil?.toISOString() ?? null,
  });
}

/** Outside guests: send webinar chat. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(`webinar-guest-chat-post:${ip}`, 60, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tokenParsed = joinTokenSchema.safeParse(json);
  if (!tokenParsed.success) {
    return NextResponse.json({ error: "Invalid join token." }, { status: 400 });
  }

  const bodyParsed = chatMessageSchema.safeParse(json);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: bodyParsed.error.issues[0]?.message || "Invalid message" },
      { status: 400 }
    );
  }

  const guest = await loadGuest(tokenParsed.data.joinToken);
  if (!guest) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  if (guest.kickedAt) {
    return NextResponse.json(
      { error: "You've been removed from this webinar." },
      { status: 403 }
    );
  }
  if (!canJoinWebinar(guest.webinar.status) && guest.webinar.status !== "ENDED") {
    return NextResponse.json({ error: "Chat is closed." }, { status: 403 });
  }

  if (guest.chatMutedUntil && guest.chatMutedUntil.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "You've been muted in this webinar chat." },
      { status: 403 }
    );
  }

  const message = await prisma.webinarChatMessage.create({
    data: {
      webinarId: guest.webinar.id,
      guestId: guest.id,
      body: bodyParsed.data.body,
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

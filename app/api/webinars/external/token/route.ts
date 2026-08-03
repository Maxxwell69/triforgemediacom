import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canJoinWebinar } from "@/lib/webinars";
import { getLiveKitUrl, isLiveKitConfigured, mintWebinarToken } from "@/lib/livekit";
import { webinarGuestIdentity } from "@/lib/webinarExternal";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  joinToken: z.string().min(16).max(128),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(`webinar-guest-token:${ip}`, 30, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: "LiveKit is not configured on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid join token." }, { status: 400 });
  }

  const guest = await prisma.webinarGuest.findUnique({
    where: { joinToken: parsed.data.joinToken },
    include: {
      webinar: {
        select: {
          id: true,
          status: true,
          livekitRoomName: true,
          externalSignupEnabled: true,
        },
      },
    },
  });

  if (!guest || !guest.webinar.externalSignupEnabled) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  if (guest.kickedAt) {
    return NextResponse.json(
      { error: "You've been removed from this webinar." },
      { status: 403 }
    );
  }

  if (!canJoinWebinar(guest.webinar.status)) {
    return NextResponse.json(
      {
        error:
          guest.webinar.status === "ENDED"
            ? "This webinar has ended."
            : "This webinar is not open yet.",
      },
      { status: 403 }
    );
  }

  if (!guest.joinedAt) {
    await prisma.webinarGuest.update({
      where: { id: guest.id },
      data: { joinedAt: new Date() },
    });
  }

  const identity = webinarGuestIdentity(guest.id);
  const token = await mintWebinarToken({
    identity,
    name: guest.name,
    roomName: guest.webinar.livekitRoomName,
    role: "audience",
  });

  return NextResponse.json({
    token,
    url: getLiveKitUrl(),
    roomName: guest.webinar.livekitRoomName,
    role: "AUDIENCE",
    avatarUrl: null,
  });
}

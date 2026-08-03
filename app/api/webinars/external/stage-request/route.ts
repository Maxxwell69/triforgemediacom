import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canJoinWebinar } from "@/lib/webinars";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { resolveWebinarGuestRole } from "@/lib/webinarExternal";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  joinToken: z.string().min(16).max(128),
});

/** Outside guest raises hand to request stage. */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(`webinar-guest-hand:${ip}`, 40, 60 * 60 * 1000);
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
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
    return NextResponse.json({ error: "Webinar is not open." }, { status: 403 });
  }

  const role = resolveWebinarGuestRole(guest);
  if (role === "SPEAKER") {
    return NextResponse.json({ error: "You are already on stage." }, { status: 400 });
  }

  const updated = await prisma.webinarGuest.update({
    where: { id: guest.id },
    data: {
      stageRequestStatus: "PENDING",
      stageRequestedAt: new Date(),
    },
    select: { id: true, stageRequestStatus: true, stageRequestedAt: true },
  });

  return NextResponse.json({ request: updated });
}

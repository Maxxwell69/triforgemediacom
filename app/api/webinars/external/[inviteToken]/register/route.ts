import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { webinarExternalSignupSchema } from "@/lib/validations/webinar";
import { generateWebinarExternalToken } from "@/lib/webinarExternal";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(
  req: Request,
  { params }: { params: { inviteToken: string } }
) {
  const ip = getClientIp(req);
  const limited = checkRateLimit(
    `webinar-external:${params.inviteToken}:${ip}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS
  );
  if (limited.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  const webinar = await prisma.webinar.findFirst({
    where: {
      externalInviteToken: params.inviteToken,
      externalSignupEnabled: true,
    },
    select: { id: true, status: true },
  });

  if (!webinar || webinar.status === "DRAFT") {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  if (webinar.status === "ENDED") {
    return NextResponse.json(
      { error: "This webinar has ended. Registration is closed." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = webinarExternalSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name;

  const existing = await prisma.webinarGuest.findUnique({
    where: {
      webinarId_email: { webinarId: webinar.id, email },
    },
    select: { joinToken: true },
  });

  if (existing) {
    // Same email re-opening the invite gets their personal access page again.
    return NextResponse.json({
      accessPath: `/w/${params.inviteToken}/access/${existing.joinToken}`,
    });
  }

  const guest = await prisma.webinarGuest.create({
    data: {
      webinarId: webinar.id,
      name,
      email,
      joinToken: generateWebinarExternalToken(),
    },
    select: { joinToken: true },
  });

  return NextResponse.json({
    accessPath: `/w/${params.inviteToken}/access/${guest.joinToken}`,
  });
}

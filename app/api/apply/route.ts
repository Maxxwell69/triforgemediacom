import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validations/apply";
import { sendCreatorNetworkInfoEmail, sendNewApplicationAdminAlert } from "@/lib/email";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { syncMnMembership } from "@/lib/mnCn";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// A genuine applicant only ever needs to submit once (or once more after a
// rejection). This is generous enough for real usage but blocks scripted
// spam/enumeration against the public, unauthenticated endpoint.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Shown for every "you already have an application" case regardless of its
// actual status — a distinct message per status (pending vs. approved vs.
// doesn't exist) would let someone enumerate which emails have applied.
const ALREADY_APPLIED_MESSAGE =
  "We already have an application on file for this email. If you're waiting to hear back, sit tight — otherwise check your inbox for next steps.";

async function alertAdmins(application: {
  name: string;
  email: string;
  platform: string;
  handle: string;
  phone: string;
  smsConsent: boolean;
  socialLink: string | null;
  goals: string;
  whyJoin: string;
  hasAgency: boolean;
}) {
  try {
    const admins = await getAlertableAdminEmails();
    await sendNewApplicationAdminAlert(admins, {
      name: application.name,
      email: application.email,
      platform: application.platform,
      handle: application.handle,
      phone: application.phone,
      smsConsent: application.smsConsent,
      socialLink: application.socialLink,
      goals: application.goals,
      whyJoin: application.whyJoin,
      track: application.hasAgency ? "MN" : "CN",
    });
  } catch (err) {
    // Never fail the application submission because the notification email failed.
    console.error("Failed to send new-application admin alert:", err);
  }
}

async function routeByAgencyStatus(userId: string, name: string, email: string, hasAgency: boolean) {
  try {
    await syncMnMembership(userId, hasAgency);
    if (!hasAgency) {
      await sendCreatorNetworkInfoEmail(email, name);
    }
  } catch (err) {
    console.error("Failed to route applicant by agency status:", err);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`apply:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many applications submitted from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, platform, handle, phone, smsConsent, socialLink, goals, whyJoin, hasAgency } =
    parsed.data;
  const normalizedEmail = email.toLowerCase();
  const hasAgencyBool = hasAgency === "yes";

  const answers = {
    name,
    platform,
    handle,
    phone,
    smsConsent,
    socialLink: socialLink || null,
    goals,
    whyJoin,
    hasAgency,
  };

  async function notify(userId: string) {
    await Promise.all([
      alertAdmins({
        name,
        email: normalizedEmail,
        platform,
        handle,
        phone,
        smsConsent,
        socialLink: socialLink || null,
        goals,
        whyJoin,
        hasAgency: hasAgencyBool,
      }),
      routeByAgencyStatus(userId, name, normalizedEmail, hasAgencyBool),
    ]);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { application: true },
  });

  if (existingUser) {
    if (existingUser.application) {
      const status = existingUser.application.status;
      if (status === "PENDING" || status === "APPROVED") {
        return NextResponse.json({ error: ALREADY_APPLIED_MESSAGE }, { status: 409 });
      }
      // REJECTED: fall through and allow them to update their answers + reapply.
      await prisma.application.update({
        where: { userId: existingUser.id },
        data: {
          answers,
          status: "PENDING",
          reviewNotes: null,
          reviewedById: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });
      await notify(existingUser.id);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // User row exists (e.g. from a prior partial signup) but no application yet.
    await prisma.application.create({
      data: { userId: existingUser.id, answers },
    });
    await notify(existingUser.id);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      status: "PENDING_APPLICATION",
      application: { create: { answers } },
    },
  });
  await notify(newUser.id);

  return NextResponse.json({ ok: true }, { status: 200 });
}

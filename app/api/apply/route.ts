import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validations/apply";
import {
  sendCreatorNetworkInfoEmail,
  sendMediaNetworkInfoEmail,
  sendNewApplicationAdminAlert,
  sendTikTokRequestExpectedEmail,
} from "@/lib/email";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { syncMnMembership } from "@/lib/mnCn";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { autoApproveApplication } from "@/lib/autoApprove";
import { resolveApplyTrack, countryLabel } from "@/lib/applyTrack";

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
  country: string;
  goals: string;
  whyJoin: string;
  hasAgency: boolean;
  track: "MN" | "CN";
  mnReason: "agency" | "country" | null;
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
      country: countryLabel(application.country),
      goals: application.goals,
      whyJoin: application.whyJoin,
      track: application.track,
      mnReason: application.mnReason,
      hasAgency: application.hasAgency,
    });
  } catch (err) {
    // Never fail the application submission because the notification email failed.
    console.error("Failed to send new-application admin alert:", err);
  }
}

async function routeApplicant(opts: {
  userId: string;
  name: string;
  email: string;
  applicationId: string;
  track: "MN" | "CN";
  mnReason: "agency" | "country" | null;
}) {
  try {
    await syncMnMembership(opts.userId, opts.track === "MN");
    if (opts.track === "CN") {
      // Two separate emails on purpose: the first confirms the application
      // and gets them tapping "Apply" now, the second is a dedicated
      // heads-up (with the visual guide) for what happens later once TikTok
      // shows them our request — keeping it standalone means it doesn't get
      // lost in the middle of the first email.
      await Promise.all([
        sendCreatorNetworkInfoEmail(opts.email, opts.name, opts.applicationId),
        sendTikTokRequestExpectedEmail(opts.email, opts.name),
      ]);
    } else if (opts.mnReason === "country") {
      // Outside US/Canada — explain Media Network pathway (agency MN still
      // just gets the invite via auto-approve).
      await sendMediaNetworkInfoEmail(opts.email, opts.name);
    }
  } catch (err) {
    console.error("Failed to route applicant:", err);
  }
}

// MN applicants don't wait on a TikTok CN signal — approve them into the Hub
// the moment they apply instead of sitting in the manual review queue.
async function autoApproveMn(applicationId: string) {
  try {
    await autoApproveApplication(applicationId);
  } catch (err) {
    console.error("Failed to auto-approve MN applicant:", err);
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

  const {
    name,
    email,
    platform,
    handle,
    phone,
    smsConsent,
    socialLink,
    country,
    goals,
    whyJoin,
    hasAgency,
  } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const hasAgencyBool = hasAgency === "yes";
  const { track, mnReason } = resolveApplyTrack({
    country,
    hasAgency: hasAgencyBool,
  });

  const answers = {
    name,
    platform,
    handle,
    phone,
    smsConsent,
    socialLink: socialLink || null,
    country,
    goals,
    whyJoin,
    hasAgency,
    track,
    mnReason,
  };

  async function notify(userId: string, applicationId: string) {
    await Promise.all([
      alertAdmins({
        name,
        email: normalizedEmail,
        platform,
        handle,
        phone,
        smsConsent,
        socialLink: socialLink || null,
        country,
        goals,
        whyJoin,
        hasAgency: hasAgencyBool,
        track,
        mnReason,
      }),
      routeApplicant({
        userId,
        name,
        email: normalizedEmail,
        applicationId,
        track,
        mnReason,
      }),
      track === "MN" ? autoApproveMn(applicationId) : Promise.resolve(),
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
      const updated = await prisma.application.update({
        where: { userId: existingUser.id },
        data: {
          answers,
          status: "PENDING",
          reviewNotes: null,
          reviewedById: null,
          reviewedAt: null,
          submittedAt: new Date(),
          tiktokNetworkRequested: false,
          tiktokNetworkRequestedAt: null,
          tiktokNetworkCode: null,
        },
      });
      await notify(existingUser.id, updated.id);
      return NextResponse.json(
        { ok: true, track, mnReason, applicationId: updated.id },
        { status: 200 }
      );
    }

    // User row exists (e.g. from a prior partial signup) but no application yet.
    const created = await prisma.application.create({
      data: { userId: existingUser.id, answers },
    });
    await notify(existingUser.id, created.id);
    return NextResponse.json(
      { ok: true, track, mnReason, applicationId: created.id },
      { status: 200 }
    );
  }

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      status: "PENDING_APPLICATION",
      application: { create: { answers } },
    },
    include: { application: true },
  });
  await notify(newUser.id, newUser.application!.id);

  return NextResponse.json(
    { ok: true, track, mnReason, applicationId: newUser.application!.id },
    { status: 200 }
  );
}

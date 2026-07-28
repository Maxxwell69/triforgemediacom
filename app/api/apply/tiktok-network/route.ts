import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTikTokNetworkRequestAlert } from "@/lib/email";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { autoApproveApplication } from "@/lib/autoApprove";

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

type ApplicationAnswers = { handle?: string };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(`tiktok-network:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { applicationId, action } = (body ?? {}) as {
    applicationId?: unknown;
    action?: unknown;
  };

  if (typeof applicationId !== "string" || !applicationId) {
    return NextResponse.json({ error: "Missing application" }, { status: 400 });
  }
  if (action !== "requested") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const alreadyNotified = application.tiktokNetworkRequested;
  const answers = application.answers as ApplicationAnswers | null;
  const handle = answers?.handle || "—";

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      tiktokNetworkRequested: true,
      tiktokNetworkRequestedAt: application.tiktokNetworkRequestedAt ?? new Date(),
    },
  });

  // Only the first click triggers the admin alert + auto-approval, so this
  // only fires once per applicant instead of once per click.
  let approved = false;
  if (!alreadyNotified) {
    try {
      const admins = await getAlertableAdminEmails();
      await sendTikTokNetworkRequestAlert(admins, {
        name: application.user.name || "Unknown",
        email: application.user.email,
        handle,
      });
    } catch (err) {
      console.error("Failed to send TikTok Creator Network request alert:", err);
    }

    // Opting into the TikTok Creator Network is treated as enough signal to
    // let them into the Hub right away — rather than making them wait on a
    // manual admin review — so they can start the "Joining the Creator
    // Network" course while we finish linking them on TikTok's side.
    try {
      approved = await autoApproveApplication(application.id);
    } catch (err) {
      console.error("Failed to auto-approve applicant from TikTok Creator Network opt-in:", err);
    }
  }

  return NextResponse.json({ ok: true, approved });
}

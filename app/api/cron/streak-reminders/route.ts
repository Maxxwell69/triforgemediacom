import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfTodayUTC } from "@/lib/tiktask";
import { sendStreakReminderEmail } from "@/lib/email";

/**
 * Intended to be hit once a day (e.g. evening) by an external scheduler —
 * Railway Cron Job, GitHub Actions scheduled workflow, or a free pinger like
 * cron-job.org — pointed at this URL with `?secret=<CRON_SECRET>` or an
 * `Authorization: Bearer <CRON_SECRET>` header. Nothing in-app triggers it.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET isn't configured" }, { status: 500 });
  }

  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfTodayUTC();

  const atRiskProfiles = await prisma.profile.findMany({
    where: {
      streakCount: { gt: 0 },
      OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: today } }],
      user: { status: "ACTIVE" },
    },
    select: {
      streakCount: true,
      user: { select: { email: true, name: true } },
    },
  });

  let sent = 0;
  for (const profile of atRiskProfiles) {
    try {
      await sendStreakReminderEmail(
        profile.user.email,
        profile.user.name || "there",
        profile.streakCount
      );
      sent++;
    } catch (err) {
      console.error(`Failed to send streak reminder to ${profile.user.email}:`, err);
    }
  }

  return NextResponse.json({ checked: atRiskProfiles.length, sent });
}

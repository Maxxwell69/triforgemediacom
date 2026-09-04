import { NextRequest, NextResponse } from "next/server";
import { sendDueAppointmentReminders } from "@/lib/bookingReminders";

/**
 * Sends 1-hour-before emails for confirmed bookings.
 * Hit every 15 minutes via GitHub Actions with `?secret=<CRON_SECRET>`.
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

  try {
    const result = await sendDueAppointmentReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("booking-reminders cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Booking reminder cron failed" },
      { status: 500 }
    );
  }
}

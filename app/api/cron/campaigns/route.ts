import { NextRequest, NextResponse } from "next/server";
import { runTimedCampaigns } from "@/lib/campaigns/engine";

/**
 * Evaluates date-based campaigns (inactive, never logged in, days after first login).
 * Hit hourly via GitHub Actions with `?secret=<CRON_SECRET>`.
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
    const result = await runTimedCampaigns();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("campaigns cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Campaign cron failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { syncRosterLiveStatus } from "@/lib/tiktokLive";

/**
 * Polls tik.tools for who is live, updates TikTokStatsSnapshot, syncs the LIVE
 * tag, and backfills missing TikTok social links from application handles.
 *
 * Hit every few minutes via GitHub Actions / external cron with
 * `?secret=<CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.
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
    const result = await syncRosterLiveStatus();
    return NextResponse.json(result);
  } catch (err) {
    console.error("tiktok-live cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Live sync failed" },
      { status: 500 }
    );
  }
}

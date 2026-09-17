import { NextRequest, NextResponse } from "next/server";
import { runDueScheduledBroadcasts } from "@/lib/broadcasts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Sends due recurring Hub 0 broadcasts.
 * Hit every ~10 minutes via GitHub Actions with
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
    const result = await runDueScheduledBroadcasts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("broadcasts cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Broadcast cron failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runSocialPlannerCron } from "@/lib/socialPlanner/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Publishes due Social Planner videos/photos and sends LIVE reminders.
 * Hit every few minutes via GitHub Actions with
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
    const result = await runSocialPlannerCron();
    return NextResponse.json(result);
  } catch (err) {
    console.error("social-planner cron failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Social planner cron failed" },
      { status: 500 }
    );
  }
}

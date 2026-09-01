import { NextResponse } from "next/server";

/**
 * Railway healthcheck target. Must return 200 with no redirect and no DB
 * — /login 307s to /signin, which can fail the deploy healthcheck.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, version: process.env.npm_package_version ?? "ok" });
}

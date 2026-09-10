import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { socialPlannerEnabled } from "@/lib/socialPlanner/module";
import {
  getTikTokPublishAuthorizeUrl,
  isTikTokConfigured,
  TIKTOK_PUBLISH_STATE_COOKIE,
} from "@/lib/socialPlanner/oauth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectAccounts(status: "error", message: string) {
  const url = new URL("/admin/social-planner/accounts", APP_URL);
  url.searchParams.set("tiktok", status);
  url.searchParams.set("tiktok_message", message);
  return NextResponse.redirect(url);
}

export async function GET() {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }
  if (!socialPlannerEnabled()) {
    return NextResponse.redirect(new URL("/admin", APP_URL));
  }
  if (!isTikTokConfigured()) {
    return redirectAccounts(
      "error",
      "TikTok posting isn't set up yet. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET, then enable Content Posting API in the TikTok developer portal."
    );
  }

  const state = randomBytes(24).toString("hex");
  cookies().set(TIKTOK_PUBLISH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getTikTokPublishAuthorizeUrl(state));
}

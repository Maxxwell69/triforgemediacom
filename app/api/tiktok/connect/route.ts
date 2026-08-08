import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getTikTokAuthorizeUrl, isTikTokConfigured, TIKTOK_STATE_COOKIE } from "@/lib/tiktokOAuth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  if (!isTikTokConfigured()) {
    const url = new URL("/account/insights", APP_URL);
    url.searchParams.set("tiktok", "error");
    url.searchParams.set("tiktok_message", "TikTok integration isn't set up yet — check back soon.");
    return NextResponse.redirect(url);
  }

  const state = randomBytes(24).toString("hex");
  cookies().set(TIKTOK_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getTikTokAuthorizeUrl(state));
}

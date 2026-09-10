import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { socialPlannerEnabled } from "@/lib/socialPlanner/module";
import {
  exchangePublishCodeForTokens,
  TIKTOK_PUBLISH_STATE_COOKIE,
  upsertPlannerAccountFromTokens,
} from "@/lib/socialPlanner/oauth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectAccounts(status: "connected" | "error", message?: string) {
  const url = new URL("/admin/social-planner/accounts", APP_URL);
  url.searchParams.set("tiktok", status);
  if (message) url.searchParams.set("tiktok_message", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }
  if (!socialPlannerEnabled()) {
    return NextResponse.redirect(new URL("/admin", APP_URL));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const expectedState = cookies().get(TIKTOK_PUBLISH_STATE_COOKIE)?.value;
  cookies().delete(TIKTOK_PUBLISH_STATE_COOKIE);

  if (error) {
    return redirectAccounts("error", "You cancelled the TikTok posting connection.");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectAccounts("error", "That connection link expired — please try again.");
  }

  try {
    const tokens = await exchangePublishCodeForTokens(code);
    await upsertPlannerAccountFromTokens({ connectedById: user.id, tokens });
    return redirectAccounts("connected");
  } catch (err) {
    console.error("TikTok publish OAuth callback failed:", err);
    return redirectAccounts(
      "error",
      "Couldn't connect TikTok for posting. Confirm Content Posting API and video.publish are approved on the developer app."
    );
  }
}

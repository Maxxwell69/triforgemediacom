import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens, fetchTikTokUserInfo, TIKTOK_STATE_COOKIE } from "@/lib/tiktokOAuth";
import { persistTikTokAvatarUrl } from "@/lib/tiktokAvatar";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectToAccount(status: "connected" | "error", message?: string) {
  const url = new URL("/account/insights", APP_URL);
  url.searchParams.set("tiktok", status);
  if (message) url.searchParams.set("tiktok_message", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const expectedState = cookies().get(TIKTOK_STATE_COOKIE)?.value;
  cookies().delete(TIKTOK_STATE_COOKIE);

  if (error) {
    return redirectToAccount("error", "You cancelled the TikTok connection.");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToAccount("error", "That connection link expired — please try again.");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const info = await fetchTikTokUserInfo(tokens.access_token);
    const now = Date.now();
    const avatarUrl = await persistTikTokAvatarUrl(session.user.id, info.avatar_url);

    await prisma.tikTokConnection.upsert({
      where: { userId: session.user.id },
      update: {
        openId: tokens.open_id,
        displayName: info.display_name,
        avatarUrl,
        followerCount: info.follower_count,
        followingCount: info.following_count,
        likesCount: info.likes_count,
        videoCount: info.video_count,
        statsUpdatedAt: new Date(),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000),
        refreshTokenExpiresAt: new Date(now + tokens.refresh_expires_in * 1000),
      },
      create: {
        userId: session.user.id,
        openId: tokens.open_id,
        displayName: info.display_name,
        avatarUrl,
        followerCount: info.follower_count,
        followingCount: info.following_count,
        likesCount: info.likes_count,
        videoCount: info.video_count,
        statsUpdatedAt: new Date(),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000),
        refreshTokenExpiresAt: new Date(now + tokens.refresh_expires_in * 1000),
      },
    });

    return redirectToAccount("connected");
  } catch (err) {
    console.error("TikTok OAuth callback failed:", err);
    return redirectToAccount("error", "Couldn't connect your TikTok account. Please try again.");
  }
}

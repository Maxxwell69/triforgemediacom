import { prisma } from "@/lib/prisma";

// TikTok Login Kit (OAuth 2.0) — read-only identity + stats. TikTok's public
// API has no endpoint for liking, commenting, or otherwise engaging with
// content on a user's behalf; this connection only lets us display a
// member's own follower/like/video counts and refresh them over time.
// Docs: https://developers.tiktok.com/doc/login-kit-web

const TIKTOK_SCOPES = "user.info.basic,user.info.stats";
export const TIKTOK_STATE_COOKIE = "tiktok_oauth_state";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function tiktokRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/tiktok/callback`;
}

export function isTikTokConfigured(): boolean {
  return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

export function getTikTokAuthorizeUrl(state: string): string {
  const clientKey = requireEnv("TIKTOK_CLIENT_KEY");
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
};

async function requestTokens(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "TikTok token request failed");
  }
  return data;
}

export function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  return requestTokens({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
}

export function refreshTikTokTokens(refreshToken: string): Promise<TokenResponse> {
  return requestTokens({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

type TikTokUserInfo = {
  open_id: string;
  display_name?: string;
  avatar_url?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
};

export async function fetchTikTokUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const fields = [
    "open_id",
    "display_name",
    "avatar_url",
    "follower_count",
    "following_count",
    "likes_count",
    "video_count",
  ].join(",");

  const res = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== "ok") {
    throw new Error(data.error?.message || "Failed to fetch TikTok user info");
  }
  return data.data.user as TikTokUserInfo;
}

/**
 * Returns a valid access token for this user's TikTok connection, refreshing
 * it first (and persisting the new tokens) if it's expired or about to be.
 */
export async function getFreshAccessToken(userId: string): Promise<string | null> {
  const connection = await prisma.tikTokConnection.findUnique({ where: { userId } });
  if (!connection) return null;

  const expiresSoon = connection.accessTokenExpiresAt.getTime() < Date.now() + 60_000;
  if (!expiresSoon) return connection.accessToken;

  const tokens = await refreshTikTokTokens(connection.refreshToken);
  const now = Date.now();
  await prisma.tikTokConnection.update({
    where: { userId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000),
      refreshTokenExpiresAt: new Date(now + tokens.refresh_expires_in * 1000),
    },
  });
  return tokens.access_token;
}

/** Refreshes and persists cached stats for a user's TikTok connection. */
export async function refreshTikTokStats(userId: string) {
  const accessToken = await getFreshAccessToken(userId);
  if (!accessToken) return null;

  const info = await fetchTikTokUserInfo(accessToken);
  return prisma.tikTokConnection.update({
    where: { userId },
    data: {
      displayName: info.display_name,
      avatarUrl: info.avatar_url,
      followerCount: info.follower_count,
      followingCount: info.following_count,
      likesCount: info.likes_count,
      videoCount: info.video_count,
      statsUpdatedAt: new Date(),
    },
  });
}

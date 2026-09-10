import "server-only";

import { prisma } from "@/lib/prisma";
import { isTikTokConfigured } from "@/lib/tiktokOAuth";
import { persistTikTokAvatarUrl } from "@/lib/tiktokAvatar";

export const TIKTOK_PUBLISH_STATE_COOKIE = "tiktok_publish_oauth_state";
export const TIKTOK_PUBLISH_SCOPES = "user.info.basic,video.publish";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function tiktokPublishRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/tiktok/publish/callback`;
}

export { isTikTokConfigured };

export function getTikTokPublishAuthorizeUrl(state: string): string {
  const clientKey = requireEnv("TIKTOK_CLIENT_KEY");
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_PUBLISH_SCOPES,
    response_type: "code",
    redirect_uri: tiktokPublishRedirectUri(),
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

export function exchangePublishCodeForTokens(code: string): Promise<TokenResponse> {
  return requestTokens({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: tiktokPublishRedirectUri(),
  });
}

export function refreshPublishTokens(refreshToken: string): Promise<TokenResponse> {
  return requestTokens({
    client_key: requireEnv("TIKTOK_CLIENT_KEY"),
    client_secret: requireEnv("TIKTOK_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export type TikTokCreatorInfo = {
  creatorUsername: string | null;
  creatorNickname: string | null;
  creatorAvatarUrl: string | null;
  privacyLevelOptions: string[];
  maxVideoPostDurationSec: number | null;
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
};

type TikTokApiError = { code?: string; message?: string };

export async function queryCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: "{}",
  });
  const data = (await res.json()) as {
    data?: {
      creator_username?: string;
      creator_nickname?: string;
      creator_avatar_url?: string;
      privacy_level_options?: string[];
      max_video_post_duration_sec?: number;
      comment_disabled?: boolean;
      duet_disabled?: boolean;
      stitch_disabled?: boolean;
    };
    error?: TikTokApiError;
  };
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(data.error?.message || "Failed to query TikTok creator info");
  }

  const info = data.data ?? {};
  return {
    creatorUsername: info.creator_username || null,
    creatorNickname: info.creator_nickname || null,
    creatorAvatarUrl: info.creator_avatar_url || null,
    privacyLevelOptions: Array.isArray(info.privacy_level_options) ? info.privacy_level_options : [],
    maxVideoPostDurationSec:
      typeof info.max_video_post_duration_sec === "number" ? info.max_video_post_duration_sec : null,
    commentDisabled: !!info.comment_disabled,
    duetDisabled: !!info.duet_disabled,
    stitchDisabled: !!info.stitch_disabled,
  };
}

export async function getFreshPublishAccessToken(accountId: string): Promise<string> {
  const account = await prisma.socialPlannerAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("TikTok account is no longer connected");

  const expiresSoon = account.accessTokenExpiresAt.getTime() < Date.now() + 60_000;
  if (!expiresSoon) return account.accessToken;

  const tokens = await refreshPublishTokens(account.refreshToken);
  const now = Date.now();
  await prisma.socialPlannerAccount.update({
    where: { id: accountId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: new Date(now + tokens.expires_in * 1000),
      refreshTokenExpiresAt: new Date(now + tokens.refresh_expires_in * 1000),
      scopes: tokens.scope || account.scopes,
    },
  });
  return tokens.access_token;
}

export async function upsertPlannerAccountFromTokens(opts: {
  connectedById: string;
  tokens: TokenResponse;
}): Promise<string> {
  const now = Date.now();
  let creator: TikTokCreatorInfo | null = null;
  try {
    creator = await queryCreatorInfo(opts.tokens.access_token);
  } catch (err) {
    console.error("TikTok creator_info query failed:", err);
  }

  const avatarUrl = creator?.creatorAvatarUrl
    ? await persistTikTokAvatarUrl(opts.connectedById, creator.creatorAvatarUrl)
    : null;

  const existing = await prisma.socialPlannerAccount.findUnique({
    where: { openId: opts.tokens.open_id },
    select: { id: true },
  });

  const data = {
    connectedById: opts.connectedById,
    username: creator?.creatorUsername ?? undefined,
    nickname: creator?.creatorNickname ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
    accessToken: opts.tokens.access_token,
    refreshToken: opts.tokens.refresh_token,
    accessTokenExpiresAt: new Date(now + opts.tokens.expires_in * 1000),
    refreshTokenExpiresAt: new Date(now + opts.tokens.refresh_expires_in * 1000),
    scopes: opts.tokens.scope || TIKTOK_PUBLISH_SCOPES,
    privacyLevelOptions: creator?.privacyLevelOptions ?? undefined,
    maxVideoDurationSec: creator?.maxVideoPostDurationSec ?? undefined,
    commentDisabled: creator?.commentDisabled ?? false,
    duetDisabled: creator?.duetDisabled ?? false,
    stitchDisabled: creator?.stitchDisabled ?? false,
  };

  if (existing) {
    await prisma.socialPlannerAccount.update({ where: { id: existing.id }, data });
    return existing.id;
  }

  const created = await prisma.socialPlannerAccount.create({
    data: {
      openId: opts.tokens.open_id,
      ...data,
      username: creator?.creatorUsername ?? null,
      nickname: creator?.creatorNickname ?? null,
      avatarUrl,
      privacyLevelOptions: creator?.privacyLevelOptions ?? [],
      maxVideoDurationSec: creator?.maxVideoPostDurationSec ?? null,
    },
  });
  return created.id;
}

export async function refreshPlannerAccountCreatorInfo(accountId: string): Promise<TikTokCreatorInfo> {
  const accessToken = await getFreshPublishAccessToken(accountId);
  const creator = await queryCreatorInfo(accessToken);
  const account = await prisma.socialPlannerAccount.findUnique({
    where: { id: accountId },
    select: { connectedById: true },
  });
  const avatarUrl = creator.creatorAvatarUrl
    ? await persistTikTokAvatarUrl(account?.connectedById || accountId, creator.creatorAvatarUrl)
    : null;

  await prisma.socialPlannerAccount.update({
    where: { id: accountId },
    data: {
      username: creator.creatorUsername,
      nickname: creator.creatorNickname,
      avatarUrl: avatarUrl ?? undefined,
      privacyLevelOptions: creator.privacyLevelOptions,
      maxVideoDurationSec: creator.maxVideoPostDurationSec,
      commentDisabled: creator.commentDisabled,
      duetDisabled: creator.duetDisabled,
      stitchDisabled: creator.stitchDisabled,
    },
  });
  return creator;
}

import "server-only";

import type { SocialPlannerItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getR2ObjectRange, getR2ObjectSize } from "@/lib/r2";
import { getFreshPublishAccessToken, queryCreatorInfo } from "@/lib/socialPlanner/oauth";

const CHUNK_SIZE = 10 * 1024 * 1024;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_MS = 90_000;

type TikTokApiError = { code?: string; message?: string; log_id?: string };

function tiktokErrorMessage(data: { error?: TikTokApiError }, fallback: string): string {
  return data.error?.message || data.error?.code || fallback;
}

async function tiktokPost<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`https://open.tiktokapis.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: TikTokApiError };
  if (!res.ok || (data.error?.code && data.error.code !== "ok")) {
    throw new Error(tiktokErrorMessage(data, `TikTok request failed (${res.status})`));
  }
  return data;
}

function postInfoFromItem(item: SocialPlannerItem) {
  return {
    title: (item.kind === "PHOTO" ? item.title || item.caption : item.caption) || "",
    privacy_level: item.privacyLevel,
    disable_comment: item.disableComment,
    disable_duet: item.disableDuet,
    disable_stitch: item.disableStitch,
  };
}

async function uploadChunksToTikTok(opts: {
  uploadUrl: string;
  key: string;
  videoSize: number;
  mime: string;
}) {
  const totalChunks = Math.max(1, Math.ceil(opts.videoSize / CHUNK_SIZE));
  const contentType =
    opts.mime === "video/quicktime" || opts.mime === "video/webm" ? opts.mime : "video/mp4";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, opts.videoSize) - 1;
    const chunk = await getR2ObjectRange(opts.key, start, end);
    const put = await fetch(opts.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${opts.videoSize}`,
      },
      body: new Uint8Array(chunk),
    });
    if (!put.ok) {
      const text = await put.text().catch(() => "");
      throw new Error(`TikTok upload failed (${put.status})${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
  }
}

export async function fetchPublishStatus(
  accessToken: string,
  publishId: string
): Promise<{ status: string; failReason: string | null; shareUrl: string | null }> {
  const data = await tiktokPost<{
    data?: {
      status?: string;
      fail_reason?: string;
      publicaly_available_post_id?: string[];
    };
  }>("/v2/post/publish/status/fetch/", accessToken, { publish_id: publishId });

  const status = data.data?.status || "UNKNOWN";
  const failReason = data.data?.fail_reason || null;
  const postIds = data.data?.publicaly_available_post_id;
  const shareUrl =
    Array.isArray(postIds) && postIds[0] ? `https://www.tiktok.com/video/${postIds[0]}` : null;
  return { status, failReason, shareUrl };
}

function isTerminalSuccess(status: string) {
  return status === "PUBLISH_COMPLETE" || status === "SEND_TO_USER_INBOX";
}

function isTerminalFail(status: string) {
  return status === "FAILED" || status === "PUBLISH_FAILED";
}

async function pollUntilDone(accessToken: string, publishId: string) {
  const started = Date.now();
  let last = { status: "PROCESSING", failReason: null as string | null, shareUrl: null as string | null };
  while (Date.now() - started < MAX_POLL_MS) {
    last = await fetchPublishStatus(accessToken, publishId);
    if (isTerminalSuccess(last.status) || isTerminalFail(last.status)) return last;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return last;
}

async function initVideoPublish(item: SocialPlannerItem, accessToken: string) {
  if (!item.mediaR2Key) throw new Error("This post has no video file");
  const videoSize = item.mediaBytes && item.mediaBytes > 0 ? item.mediaBytes : await getR2ObjectSize(item.mediaR2Key);
  const chunkCount = Math.max(1, Math.ceil(videoSize / CHUNK_SIZE));

  const data = await tiktokPost<{
    data?: { publish_id?: string; upload_url?: string };
  }>("/v2/post/publish/video/init/", accessToken, {
    post_info: postInfoFromItem(item),
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSize,
      chunk_size: CHUNK_SIZE,
      total_chunk_count: chunkCount,
    },
  });

  const publishId = data.data?.publish_id;
  const uploadUrl = data.data?.upload_url;
  if (!publishId || !uploadUrl) {
    throw new Error("TikTok did not return an upload URL");
  }

  await uploadChunksToTikTok({
    uploadUrl,
    key: item.mediaR2Key,
    videoSize,
    mime: item.mediaMime || "video/mp4",
  });

  return publishId;
}

async function initPhotoPublish(item: SocialPlannerItem, accessToken: string) {
  if (!item.mediaUrl) throw new Error("This post has no photo URL");
  const data = await tiktokPost<{ data?: { publish_id?: string } }>(
    "/v2/post/publish/content/init/",
    accessToken,
    {
      post_info: {
        title: item.title || item.caption || "",
        description: item.caption || "",
        privacy_level: item.privacyLevel,
        disable_comment: item.disableComment,
        auto_add_music: true,
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: [item.mediaUrl],
      },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }
  );
  const publishId = data.data?.publish_id;
  if (!publishId) throw new Error("TikTok did not return a publish id");
  return publishId;
}

export async function publishPlannerItem(itemId: string): Promise<{
  ok: boolean;
  status: string;
  error?: string;
}> {
  const item = await prisma.socialPlannerItem.findUnique({
    where: { id: itemId },
    include: { account: true },
  });
  if (!item) return { ok: false, status: "MISSING", error: "Post not found" };
  if (item.kind === "LIVE") {
    return { ok: false, status: "SKIPPED", error: "LIVE reminders cannot be published via API" };
  }

  const attempt = await prisma.socialPlannerPublishAttempt.create({
    data: { itemId, startedAt: new Date() },
  });

  try {
    const accessToken = await getFreshPublishAccessToken(item.accountId);
    const creator = await queryCreatorInfo(accessToken);
    if (creator.privacyLevelOptions.length > 0 && !creator.privacyLevelOptions.includes(item.privacyLevel)) {
      throw new Error(
        `Privacy "${item.privacyLevel}" is not allowed for this TikTok account. Pick one of: ${creator.privacyLevelOptions.join(", ")}`
      );
    }

    let publishId = item.tiktokPublishId;
    if (!publishId) {
      publishId =
        item.kind === "PHOTO"
          ? await initPhotoPublish(item, accessToken)
          : await initVideoPublish(item, accessToken);
      await prisma.socialPlannerItem.update({
        where: { id: item.id },
        data: { tiktokPublishId: publishId },
      });
    }

    const result = await pollUntilDone(accessToken, publishId);
    await prisma.socialPlannerPublishAttempt.update({
      where: { id: attempt.id },
      data: {
        finishedAt: new Date(),
        ok: isTerminalSuccess(result.status),
        rawStatus: result.status,
        publishId,
        error: result.failReason,
      },
    });

    if (isTerminalSuccess(result.status)) {
      await prisma.socialPlannerItem.update({
        where: { id: item.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          tiktokShareUrl: result.shareUrl,
          lastError: null,
        },
      });
      return { ok: true, status: result.status };
    }

    if (isTerminalFail(result.status)) {
      const error = result.failReason || "TikTok rejected the post";
      await prisma.socialPlannerItem.update({
        where: { id: item.id },
        data: { status: "FAILED", lastError: error },
      });
      return { ok: false, status: result.status, error };
    }

    // Still processing — leave PUBLISHING for the next cron tick to poll.
    return { ok: false, status: result.status, error: "Still processing on TikTok" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Publish failed";
    await prisma.socialPlannerPublishAttempt.update({
      where: { id: attempt.id },
      data: { finishedAt: new Date(), ok: false, error },
    });
    await prisma.socialPlannerItem.update({
      where: { id: item.id },
      data: { status: "FAILED", lastError: error },
    });
    return { ok: false, status: "FAILED", error };
  }
}

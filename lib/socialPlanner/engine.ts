import "server-only";

import { prisma } from "@/lib/prisma";
import { sendSocialPlannerLiveReminderEmail } from "@/lib/email";
import { checkLive, isTikToolsConfigured } from "@/lib/tiktools";
import { hubHas } from "@/lib/hub/modules";
import { fetchPublishStatus, publishPlannerItem } from "@/lib/socialPlanner/tiktokPublish";
import { getFreshPublishAccessToken } from "@/lib/socialPlanner/oauth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const HOUR_MS = 60 * 60 * 1000;
const MAX_PUBLISH_BATCH = 3;
const MAX_LIVE_BATCH = 20;

function plannerUrl(itemId: string) {
  return `${APP_URL}/admin/social-planner/${itemId}`;
}

async function claimDuePosts() {
  const due = await prisma.socialPlannerItem.findMany({
    where: {
      status: "SCHEDULED",
      kind: { in: ["VIDEO", "PHOTO"] },
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: MAX_PUBLISH_BATCH,
    select: { id: true },
  });

  const claimed: string[] = [];
  for (const row of due) {
    const result = await prisma.socialPlannerItem.updateMany({
      where: { id: row.id, status: "SCHEDULED" },
      data: { status: "PUBLISHING", lastError: null },
    });
    if (result.count === 1) claimed.push(row.id);
  }
  return claimed;
}

async function pollInFlight() {
  const inflight = await prisma.socialPlannerItem.findMany({
    where: {
      status: "PUBLISHING",
      kind: { in: ["VIDEO", "PHOTO"] },
      tiktokPublishId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    take: MAX_PUBLISH_BATCH,
    select: { id: true, tiktokPublishId: true, accountId: true },
  });

  let polled = 0;
  for (const item of inflight) {
    if (!item.tiktokPublishId) continue;
    try {
      const token = await getFreshPublishAccessToken(item.accountId);
      const result = await fetchPublishStatus(token, item.tiktokPublishId);
      polled += 1;
      if (result.status === "PUBLISH_COMPLETE" || result.status === "SEND_TO_USER_INBOX") {
        await prisma.socialPlannerItem.update({
          where: { id: item.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            tiktokShareUrl: result.shareUrl,
            lastError: null,
          },
        });
      } else if (result.status === "FAILED" || result.status === "PUBLISH_FAILED") {
        await prisma.socialPlannerItem.update({
          where: { id: item.id },
          data: { status: "FAILED", lastError: result.failReason || "TikTok rejected the post" },
        });
      }
    } catch (err) {
      console.error("Social planner status poll failed:", item.id, err);
    }
  }
  return polled;
}

async function sendLiveReminders() {
  const now = Date.now();
  const windowStart = new Date(now + 50 * 60 * 1000);
  const windowEnd = new Date(now + 75 * 60 * 1000);

  const due = await prisma.socialPlannerItem.findMany({
    where: {
      kind: "LIVE",
      status: "SCHEDULED",
      remindedAt: null,
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      account: { select: { username: true, nickname: true, connectedBy: { select: { email: true, name: true } } } },
      createdBy: { select: { email: true, name: true } },
    },
    take: MAX_LIVE_BATCH,
  });

  let sent = 0;
  for (const item of due) {
    const handle = item.account.username
      ? `@${item.account.username}`
      : item.account.nickname || "TikTok";
    const when = item.scheduledAt
      ? new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(item.scheduledAt)
      : "soon";
    const recipients = new Set(
      [item.createdBy.email, item.account.connectedBy.email].filter((e): e is string => !!e)
    );
    for (const email of Array.from(recipients)) {
      await sendSocialPlannerLiveReminderEmail(email, {
        name: item.createdBy.name || item.account.connectedBy.name,
        handle,
        title: item.title || item.caption || "TikTok LIVE",
        whenLabel: when,
        url: plannerUrl(item.id),
      });
    }
    await prisma.socialPlannerItem.update({
      where: { id: item.id },
      data: { remindedAt: new Date() },
    });
    sent += 1;
  }
  return sent;
}

async function detectLives() {
  if (!isTikToolsConfigured()) return 0;

  const windowStart = new Date(Date.now() - 4 * HOUR_MS);
  const windowEnd = new Date(Date.now() + 30 * 60 * 1000);
  const items = await prisma.socialPlannerItem.findMany({
    where: {
      kind: "LIVE",
      status: "SCHEDULED",
      liveDetectedAt: null,
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    include: { account: { select: { username: true } } },
    take: MAX_LIVE_BATCH,
  });

  let detected = 0;
  for (const item of items) {
    const uniqueId = item.account.username?.replace(/^@/, "").trim();
    if (!uniqueId) continue;
    try {
      const live = await checkLive(uniqueId);
      if (!live.isLive) continue;
      await prisma.socialPlannerItem.update({
        where: { id: item.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          liveDetectedAt: new Date(),
          lastError: null,
        },
      });
      detected += 1;
    } catch (err) {
      console.error("Social planner live check failed:", uniqueId, err);
    }
  }
  return detected;
}

export async function runSocialPlannerCron() {
  if (!hubHas("socialPlanner")) {
    return { skipped: true as const, reason: "module off" };
  }

  const claimed = await claimDuePosts();
  const published: Array<{ id: string; ok: boolean; status: string; error?: string }> = [];
  for (const id of claimed) {
    published.push({ id, ...(await publishPlannerItem(id)) });
  }

  const polled = await pollInFlight();
  const reminders = await sendLiveReminders();
  const lives = await detectLives();

  return {
    skipped: false as const,
    claimed: claimed.length,
    published,
    polled,
    reminders,
    lives,
  };
}

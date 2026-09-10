"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import { formTimeZone, parseZonedDateTime } from "@/lib/time";
import { formFlagOn, socialPlannerItemSchema } from "@/lib/validations/socialPlanner";
import { isSocialPlannerMediaKey } from "@/lib/r2";
import { publishPlannerItem } from "@/lib/socialPlanner/tiktokPublish";
import { refreshPlannerAccountCreatorInfo } from "@/lib/socialPlanner/oauth";
import type { SocialPlannerItemKind, SocialPlannerItemStatus } from "@prisma/client";

async function requireAdmin() {
  if (!hubHas("socialPlanner")) {
    throw new Error("Social Planner is not enabled");
  }
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { id: dbUser.id, role: dbUser.role };
}

function revalidatePlanner(itemId?: string) {
  revalidatePath("/admin/social-planner");
  revalidatePath("/admin/social-planner/new");
  revalidatePath("/admin/social-planner/accounts");
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  if (itemId) revalidatePath(`/admin/social-planner/${itemId}`);
}

function parsePrivacyOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function resolvePrivacy(requested: string | undefined, options: string[]): string {
  if (requested && (options.length === 0 || options.includes(requested))) return requested;
  if (options.includes("SELF_ONLY")) return "SELF_ONLY";
  return options[0] || "SELF_ONLY";
}

export async function disconnectPlannerAccountAction(accountId: string) {
  await requireAdmin();
  const publishing = await prisma.socialPlannerItem.count({
    where: { accountId, status: "PUBLISHING" },
  });
  if (publishing > 0) {
    throw new Error("Wait for in-flight posts to finish before disconnecting this account.");
  }
  await prisma.socialPlannerAccount.delete({ where: { id: accountId } });
  revalidatePlanner();
}

export async function refreshPlannerAccountAction(accountId: string) {
  await requireAdmin();
  try {
    await refreshPlannerAccountCreatorInfo(accountId);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Could not refresh TikTok account info");
  }
  revalidatePlanner();
}

export async function createPlannerItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = socialPlannerItemSchema.safeParse({
    accountId: formData.get("accountId"),
    kind: formData.get("kind"),
    caption: formData.get("caption") || "",
    title: formData.get("title") || "",
    privacyLevel: formData.get("privacyLevel") || undefined,
    disableComment: formData.get("disableComment") || undefined,
    disableDuet: formData.get("disableDuet") || undefined,
    disableStitch: formData.get("disableStitch") || undefined,
    scheduledAt: formData.get("scheduledAt") || "",
    publishNow: formData.get("publishNow") || undefined,
    saveDraft: formData.get("saveDraft") || undefined,
    consent: formData.get("consent") || undefined,
    addToCalendar: formData.get("addToCalendar") || undefined,
    mediaR2Key: formData.get("mediaR2Key") || "",
    mediaUrl: formData.get("mediaUrl") || "",
    mediaMime: formData.get("mediaMime") || "",
    mediaBytes: formData.get("mediaBytes") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid post");
  }

  const account = await prisma.socialPlannerAccount.findUnique({ where: { id: parsed.data.accountId } });
  if (!account) throw new Error("That TikTok account is no longer connected");

  const kind = parsed.data.kind as SocialPlannerItemKind;
  const saveDraft = formFlagOn(parsed.data.saveDraft);
  const publishNow = formFlagOn(parsed.data.publishNow);
  const consent = formFlagOn(parsed.data.consent);
  const addToCalendar = formFlagOn(parsed.data.addToCalendar);
  const zone = formTimeZone(formData);

  if (!saveDraft && !consent) {
    throw new Error("Confirm you want to send this content to TikTok.");
  }

  const mediaR2Key = parsed.data.mediaR2Key || null;
  if (mediaR2Key && !isSocialPlannerMediaKey(mediaR2Key) && kind === "VIDEO") {
    throw new Error("Invalid video upload");
  }
  const mediaUrl = parsed.data.mediaUrl || null;
  const mediaMime = parsed.data.mediaMime || null;
  const mediaBytesRaw = parsed.data.mediaBytes ? Number(parsed.data.mediaBytes) : null;
  const mediaBytes = mediaBytesRaw && Number.isFinite(mediaBytesRaw) ? mediaBytesRaw : null;

  if (kind === "VIDEO" && !saveDraft && (!mediaR2Key || !mediaUrl)) {
    throw new Error("Upload a video before scheduling or publishing.");
  }
  if (kind === "PHOTO" && !saveDraft && !mediaUrl) {
    throw new Error("Upload a photo before scheduling or publishing.");
  }

  const options = parsePrivacyOptions(account.privacyLevelOptions);
  const privacyLevel = resolvePrivacy(parsed.data.privacyLevel, options);

  let scheduledAt: Date | null = null;
  if (!saveDraft) {
    if (publishNow) {
      scheduledAt = new Date();
    } else {
      if (!parsed.data.scheduledAt) throw new Error("Pick a date and time, or publish now.");
      scheduledAt = parseZonedDateTime(parsed.data.scheduledAt, zone, "schedule time");
    }
  }

  const status: SocialPlannerItemStatus = saveDraft ? "DRAFT" : "SCHEDULED";
  const caption = parsed.data.caption || "";
  const title = kind === "LIVE" || kind === "PHOTO" ? parsed.data.title || caption || "LIVE" : null;

  let calendarEventId: string | null = null;
  if (kind === "LIVE" && addToCalendar && scheduledAt) {
    const event = await prisma.calendarEvent.create({
      data: {
        title: title || "TikTok LIVE",
        description: caption || null,
        kind: "LIVE",
        visibility: "HUB",
        startsAt: scheduledAt,
        createdById: admin.id,
      },
    });
    calendarEventId = event.id;
  }

  const item = await prisma.socialPlannerItem.create({
    data: {
      accountId: account.id,
      createdById: admin.id,
      kind,
      status,
      caption,
      title,
      scheduledAt,
      privacyLevel,
      disableComment: formFlagOn(parsed.data.disableComment) || account.commentDisabled,
      disableDuet: formFlagOn(parsed.data.disableDuet) || account.duetDisabled,
      disableStitch: formFlagOn(parsed.data.disableStitch) || account.stitchDisabled,
      mediaR2Key,
      mediaUrl,
      mediaMime,
      mediaBytes,
      consentGivenAt: consent ? new Date() : null,
      calendarEventId,
    },
  });

  revalidatePlanner(item.id);

  if (publishNow && !saveDraft && (kind === "VIDEO" || kind === "PHOTO")) {
    await prisma.socialPlannerItem.updateMany({
      where: { id: item.id, status: "SCHEDULED" },
      data: { status: "PUBLISHING" },
    });
    await publishPlannerItem(item.id);
    revalidatePlanner(item.id);
  }

  redirect(`/admin/social-planner/${item.id}`);
}

export async function updatePlannerItemAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  const item = await prisma.socialPlannerItem.findUnique({
    where: { id },
    include: { account: true },
  });
  if (!item) throw new Error("Post not found");
  if (item.status === "PUBLISHING" || item.status === "PUBLISHED") {
    throw new Error("This post can no longer be edited.");
  }

  const parsed = socialPlannerItemSchema.safeParse({
    accountId: item.accountId,
    kind: item.kind,
    caption: formData.get("caption") || "",
    title: formData.get("title") || "",
    privacyLevel: formData.get("privacyLevel") || undefined,
    disableComment: formData.get("disableComment") || undefined,
    disableDuet: formData.get("disableDuet") || undefined,
    disableStitch: formData.get("disableStitch") || undefined,
    scheduledAt: formData.get("scheduledAt") || "",
    publishNow: formData.get("publishNow") || undefined,
    saveDraft: formData.get("saveDraft") || undefined,
    consent: formData.get("consent") || undefined,
    addToCalendar: formData.get("addToCalendar") || undefined,
    mediaR2Key: formData.get("mediaR2Key") || item.mediaR2Key || "",
    mediaUrl: formData.get("mediaUrl") || item.mediaUrl || "",
    mediaMime: formData.get("mediaMime") || item.mediaMime || "",
    mediaBytes: formData.get("mediaBytes") || (item.mediaBytes != null ? String(item.mediaBytes) : ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid post");
  }

  const saveDraft = formFlagOn(parsed.data.saveDraft);
  const publishNow = formFlagOn(parsed.data.publishNow);
  const consent = formFlagOn(parsed.data.consent);
  const zone = formTimeZone(formData);

  if (!saveDraft && !consent && !item.consentGivenAt) {
    throw new Error("Confirm you want to send this content to TikTok.");
  }

  const options = parsePrivacyOptions(item.account.privacyLevelOptions);
  const privacyLevel = resolvePrivacy(parsed.data.privacyLevel, options);

  let scheduledAt = item.scheduledAt;
  let status: SocialPlannerItemStatus = item.status;
  if (saveDraft) {
    status = "DRAFT";
  } else if (publishNow) {
    scheduledAt = new Date();
    status = "SCHEDULED";
  } else if (parsed.data.scheduledAt) {
    scheduledAt = parseZonedDateTime(parsed.data.scheduledAt, zone, "schedule time");
    status = "SCHEDULED";
  }

  const caption = parsed.data.caption || "";
  const title =
    item.kind === "LIVE" || item.kind === "PHOTO" ? parsed.data.title || caption || item.title : item.title;

  const mediaR2Key = parsed.data.mediaR2Key || item.mediaR2Key;
  const mediaUrl = parsed.data.mediaUrl || item.mediaUrl;

  if (item.kind === "VIDEO" && status !== "DRAFT" && !mediaR2Key) {
    throw new Error("Upload a video before scheduling or publishing.");
  }
  if (item.kind === "PHOTO" && status !== "DRAFT" && !mediaUrl) {
    throw new Error("Upload a photo before scheduling or publishing.");
  }

  await prisma.socialPlannerItem.update({
    where: { id },
    data: {
      caption,
      title,
      privacyLevel,
      disableComment: formFlagOn(parsed.data.disableComment),
      disableDuet: formFlagOn(parsed.data.disableDuet),
      disableStitch: formFlagOn(parsed.data.disableStitch),
      scheduledAt,
      status,
      mediaR2Key,
      mediaUrl,
      mediaMime: parsed.data.mediaMime || item.mediaMime,
      mediaBytes: parsed.data.mediaBytes ? Number(parsed.data.mediaBytes) : item.mediaBytes,
      consentGivenAt: consent ? new Date() : item.consentGivenAt,
      lastError: status === "SCHEDULED" ? null : item.lastError,
    },
  });

  if (item.calendarEventId && scheduledAt) {
    await prisma.calendarEvent.update({
      where: { id: item.calendarEventId },
      data: { title: title || item.title || "TikTok LIVE", startsAt: scheduledAt, description: caption || null },
    });
  } else if (item.kind === "LIVE" && formFlagOn(parsed.data.addToCalendar) && scheduledAt && !item.calendarEventId) {
    const event = await prisma.calendarEvent.create({
      data: {
        title: title || "TikTok LIVE",
        description: caption || null,
        kind: "LIVE",
        visibility: "HUB",
        startsAt: scheduledAt,
        createdById: admin.id,
      },
    });
    await prisma.socialPlannerItem.update({
      where: { id },
      data: { calendarEventId: event.id },
    });
  }

  if (publishNow && (item.kind === "VIDEO" || item.kind === "PHOTO")) {
    await prisma.socialPlannerItem.updateMany({
      where: { id, status: "SCHEDULED" },
      data: { status: "PUBLISHING" },
    });
    await publishPlannerItem(id);
  }

  revalidatePlanner(id);
}

export async function cancelPlannerItemAction(itemId: string) {
  await requireAdmin();
  const item = await prisma.socialPlannerItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Post not found");
  if (item.status === "PUBLISHED" || item.status === "PUBLISHING") {
    throw new Error("This post can't be canceled.");
  }
  await prisma.socialPlannerItem.update({
    where: { id: itemId },
    data: { status: "CANCELED" },
  });
  revalidatePlanner(itemId);
}

export async function retryPlannerItemAction(itemId: string) {
  await requireAdmin();
  const item = await prisma.socialPlannerItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Post not found");
  if (item.kind === "LIVE") throw new Error("LIVE reminders aren't published via API.");
  if (item.status !== "FAILED" && item.status !== "DRAFT" && item.status !== "SCHEDULED") {
    throw new Error("This post isn't ready to retry.");
  }
  if (item.kind === "VIDEO" && !item.mediaR2Key) throw new Error("Upload a video first.");
  if (item.kind === "PHOTO" && !item.mediaUrl) throw new Error("Upload a photo first.");

  await prisma.socialPlannerItem.update({
    where: { id: itemId },
    data: {
      status: "PUBLISHING",
      scheduledAt: item.scheduledAt ?? new Date(),
      tiktokPublishId: null,
      lastError: null,
    },
  });
  await publishPlannerItem(itemId);
  revalidatePlanner(itemId);
}

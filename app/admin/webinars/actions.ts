"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { webinarRoomName } from "@/lib/webinars";
import { generateWebinarExternalToken } from "@/lib/webinarExternal";
import {
  createWebinarSchema,
  updateWebinarHostAvatarSchema,
  updateWebinarSchema,
  webinarRecordingSchema,
} from "@/lib/validations/webinar";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

function parseScheduledAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid scheduled date");
  }
  return date;
}

export async function createWebinarAction(formData: FormData) {
  const session = await requireAdmin();

  const raw = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    scheduledAt: String(formData.get("scheduledAt") || ""),
    status: String(formData.get("status") || "SCHEDULED"),
    hostAvatarUrl: String(formData.get("hostAvatarUrl") || ""),
    externalSignupEnabled: formData.get("externalSignupEnabled") === "on",
  };

  const parsed = createWebinarSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const scheduledAt = parseScheduledAt(parsed.data.scheduledAt);
  const externalSignupEnabled = parsed.data.externalSignupEnabled;

  const webinar = await prisma.webinar.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      scheduledAt,
      status: parsed.data.status,
      hostAvatarUrl: parsed.data.hostAvatarUrl || null,
      hostUserId: session.user.id,
      livekitRoomName: `webinar_pending_${Date.now()}`,
      externalSignupEnabled,
      externalInviteToken: externalSignupEnabled ? generateWebinarExternalToken() : null,
    },
  });

  await prisma.webinar.update({
    where: { id: webinar.id },
    data: { livekitRoomName: webinarRoomName(webinar.id) },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  return { error: null, webinarId: webinar.id };
}

export async function updateWebinarAction(webinarId: string, formData: FormData) {
  await requireAdmin();

  const existing = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!existing) return { error: "Webinar not found" };
  if (existing.status === "LIVE" || existing.status === "ENDED") {
    return { error: "Cannot edit a live or ended webinar." };
  }

  const raw = {
    title: formData.get("title") ? String(formData.get("title")) : undefined,
    description: formData.has("description") ? String(formData.get("description")) : undefined,
    scheduledAt: formData.get("scheduledAt") ? String(formData.get("scheduledAt")) : undefined,
    status: formData.get("status") ? String(formData.get("status")) : undefined,
  };

  const parsed = updateWebinarSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  await prisma.webinar.update({
    where: { id: webinarId },
    data: {
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description || null }
        : {}),
      ...(parsed.data.scheduledAt
        ? { scheduledAt: parseScheduledAt(parsed.data.scheduledAt) }
        : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
    },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${webinarId}`);
  return { error: null };
}

/** Host photo can be set/changed even while live or after the session. */
export async function updateWebinarHostAvatarAction(webinarId: string, formData: FormData) {
  await requireAdmin();

  const existing = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!existing) return { error: "Webinar not found" };

  const parsed = updateWebinarHostAvatarSchema.safeParse({
    hostAvatarUrl: String(formData.get("hostAvatarUrl") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  await prisma.webinar.update({
    where: { id: webinarId },
    data: { hostAvatarUrl: parsed.data.hostAvatarUrl || null },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${webinarId}`);
  return { error: null };
}

export async function deleteWebinarAction(webinarId: string) {
  await requireAdmin();

  const existing = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!existing) return { error: "Webinar not found" };
  if (existing.status === "LIVE") {
    return { error: "End the webinar before deleting it." };
  }

  await prisma.webinar.delete({ where: { id: webinarId } });
  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  return { error: null };
}

export async function startWebinarAction(webinarId: string) {
  const session = await requireAdmin();
  const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!webinar) return { error: "Webinar not found" };
  if (webinar.status === "ENDED") return { error: "Already ended" };

  await prisma.webinar.update({
    where: { id: webinarId },
    data: {
      status: "LIVE",
      startedAt: webinar.startedAt ?? new Date(),
      hostUserId: webinar.hostUserId || session.user.id,
    },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${webinarId}`);
  return { error: null };
}

export async function endWebinarAction(webinarId: string) {
  await requireAdmin();
  const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!webinar) return { error: "Webinar not found" };

  await prisma.webinar.update({
    where: { id: webinarId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  await prisma.webinarAttendance.updateMany({
    where: { webinarId, leftAt: null },
    data: { leftAt: new Date() },
  });

  await prisma.webinarGuest.updateMany({
    where: { webinarId },
    data: {
      role: "AUDIENCE",
      forcedAudience: false,
      stageRequestStatus: null,
      stageRequestedAt: null,
    },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${webinarId}`);
  return { error: null };
}

export async function addWebinarRecordingAction(
  webinarId: string,
  input: { title?: string; url: string }
) {
  await requireAdmin();

  const webinar = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!webinar) return { error: "Webinar not found" };

  const parsed = webinarRecordingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid recording" };
  }

  const last = await prisma.webinarRecording.findFirst({
    where: { webinarId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.webinarRecording.create({
    data: {
      webinarId,
      title: parsed.data.title || null,
      url: parsed.data.url,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${webinarId}`);
  return { error: null };
}

export async function deleteWebinarRecordingAction(recordingId: string) {
  await requireAdmin();

  const recording = await prisma.webinarRecording.findUnique({
    where: { id: recordingId },
  });
  if (!recording) return { error: "Recording not found" };

  await prisma.webinarRecording.delete({ where: { id: recordingId } });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
  revalidatePath(`/webinars/${recording.webinarId}`);
  return { error: null };
}

/** Enable/disable the secure outside-network signup page for a webinar. */
export async function setWebinarExternalSignupAction(
  webinarId: string,
  enabled: boolean
) {
  await requireAdmin();

  const existing = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!existing) return { error: "Webinar not found" };
  if (existing.status === "ENDED") {
    return { error: "Cannot change external signup on an ended webinar." };
  }

  const token =
    enabled && !existing.externalInviteToken
      ? generateWebinarExternalToken()
      : existing.externalInviteToken;

  await prisma.webinar.update({
    where: { id: webinarId },
    data: {
      externalSignupEnabled: enabled,
      externalInviteToken: enabled ? token : existing.externalInviteToken,
    },
  });

  revalidatePath("/admin/webinars");
  return { error: null };
}

/** Rotate the public invite token (old links stop working). */
export async function regenerateWebinarExternalInviteAction(webinarId: string) {
  await requireAdmin();

  const existing = await prisma.webinar.findUnique({ where: { id: webinarId } });
  if (!existing) return { error: "Webinar not found" };
  if (!existing.externalSignupEnabled) {
    return { error: "Enable external signup first." };
  }

  await prisma.webinar.update({
    where: { id: webinarId },
    data: { externalInviteToken: generateWebinarExternalToken() },
  });

  revalidatePath("/admin/webinars");
  return { error: null };
}

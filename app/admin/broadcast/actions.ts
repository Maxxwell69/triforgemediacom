"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { generateBroadcastDraft } from "@/lib/aiEmail";
import { scoreBroadcastContent } from "@/lib/broadcastSpamScore";
import {
  audienceTargetFields,
  deliverBroadcast,
  parseAudienceFromFormData,
  resolveAudience,
  scheduleWriteData,
  type Audience,
} from "@/lib/broadcasts";
import { BROADCAST_TZ } from "@/lib/broadcastSchedule";
import {
  broadcastAudienceSchema,
  broadcastContentSchema,
  broadcastDraftSchema,
  saveBroadcastDraftSchema,
  scheduleBroadcastSchema,
} from "@/lib/validations/broadcast";

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

const BROADCAST_COOLDOWN_MS = 60_000;

export type BroadcastDraftResult =
  | { subject: string; bodyText: string; error: null }
  | { subject: null; bodyText: null; error: string };

export async function generateDraftAction(topic: string): Promise<BroadcastDraftResult> {
  await requireAdmin();

  const parsed = broadcastDraftSchema.safeParse({ topic });
  if (!parsed.success) {
    return { subject: null, bodyText: null, error: parsed.error.issues[0]?.message || "Invalid topic" };
  }

  try {
    const draft = await generateBroadcastDraft(parsed.data.topic);
    return { subject: draft.subject, bodyText: draft.paragraphs.join("\n\n"), error: null };
  } catch (err) {
    return {
      subject: null,
      bodyText: null,
      error: err instanceof Error ? err.message : "Failed to generate draft",
    };
  }
}

async function audienceLabelOnly(audience: Audience): Promise<string> {
  const resolved = await resolveAudience(audience);
  return resolved.label;
}

export type PreviewBroadcastAudienceResult =
  | {
      label: string;
      count: number;
      emails: string[];
      skippedUnsubscribed: number;
      error: null;
    }
  | {
      label: null;
      count: null;
      emails: null;
      skippedUnsubscribed: null;
      error: string;
    };

/** Admin-only: resolve the same recipient list send will use, for preview. */
export async function previewBroadcastAudienceAction(input: unknown): Promise<PreviewBroadcastAudienceResult> {
  await requireAdmin();

  const parsed = broadcastAudienceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      label: null,
      count: null,
      emails: null,
      skippedUnsubscribed: null,
      error: parsed.error.issues[0]?.message || "Invalid audience",
    };
  }

  const { recipients, label, skippedUnsubscribed } = await resolveAudience(parsed.data);
  const emails = recipients.map((r) => r.email).sort((a, b) => a.localeCompare(b));

  return {
    label,
    count: emails.length,
    emails,
    skippedUnsubscribed,
    error: null,
  };
}

export type SaveBroadcastDraftResult =
  | { draftId: string; error: null }
  | { draftId: null; error: string };

export async function saveBroadcastDraftAction(formData: FormData): Promise<SaveBroadcastDraftResult> {
  const session = await requireAdmin();

  const content = saveBroadcastDraftSchema.safeParse({
    draftId: formData.get("draftId") || null,
    subject: formData.get("subject"),
    bodyText: formData.get("bodyText") ?? "",
  });
  if (!content.success) {
    return {
      draftId: null,
      error: content.error.issues[0]?.message || "Invalid draft",
    };
  }

  const audienceParsed = broadcastAudienceSchema.safeParse(parseAudienceFromFormData(formData));
  if (!audienceParsed.success) {
    return {
      draftId: null,
      error: audienceParsed.error.issues[0]?.message || "Choose a valid audience before saving",
    };
  }

  const targets = audienceTargetFields(audienceParsed.data);
  const label = await audienceLabelOnly(audienceParsed.data);
  const draftId = content.data.draftId || null;

  if (draftId) {
    const existing = await prisma.broadcast.findUnique({ where: { id: draftId } });
    if (!existing || existing.status !== "DRAFT") {
      return { draftId: null, error: "Draft not found (it may have already been sent)." };
    }
    await prisma.broadcast.update({
      where: { id: draftId },
      data: {
        subject: content.data.subject,
        bodyText: content.data.bodyText,
        bodyHtml: "",
        audienceLabel: label,
        ...targets,
      },
    });
    revalidatePath("/admin/broadcast");
    return { draftId, error: null };
  }

  const created = await prisma.broadcast.create({
    data: {
      subject: content.data.subject,
      bodyText: content.data.bodyText,
      bodyHtml: "",
      audienceLabel: label,
      status: "DRAFT",
      createdById: session.user.id,
      recipientCount: 0,
      sentAt: null,
      sentById: null,
      ...targets,
    },
  });

  revalidatePath("/admin/broadcast");
  return { draftId: created.id, error: null };
}

export type DeleteBroadcastDraftResult = { error: string | null };

export async function deleteBroadcastDraftAction(draftId: string): Promise<DeleteBroadcastDraftResult> {
  await requireAdmin();
  if (!draftId) return { error: "Draft id required" };

  const existing = await prisma.broadcast.findUnique({ where: { id: draftId } });
  if (!existing || (existing.status !== "DRAFT" && existing.status !== "SCHEDULED")) {
    return { error: "Draft not found" };
  }

  await prisma.broadcast.delete({ where: { id: draftId } });
  revalidatePath("/admin/broadcast");
  return { error: null };
}

export type SendBroadcastResult =
  | {
      sent: number;
      failed: number;
      failedEmails: string[];
      skippedUnsubscribed: number;
      error: null;
    }
  | {
      sent: null;
      failed: null;
      failedEmails: null;
      skippedUnsubscribed: null;
      error: string;
    };

export async function sendBroadcastAction(formData: FormData): Promise<SendBroadcastResult> {
  const session = await requireAdmin();

  const recentBroadcast = await prisma.broadcast.findFirst({
    where: {
      status: "SENT",
      sentById: session.user.id,
      sentAt: { gt: new Date(Date.now() - BROADCAST_COOLDOWN_MS) },
    },
    orderBy: { sentAt: "desc" },
  });
  if (recentBroadcast?.sentAt) {
    const secondsLeft = Math.ceil(
      (BROADCAST_COOLDOWN_MS - (Date.now() - recentBroadcast.sentAt.getTime())) / 1000
    );
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: `You just sent a broadcast — wait ${Math.max(secondsLeft, 1)}s before sending another to avoid duplicate sends.`,
    };
  }

  const content = broadcastContentSchema.safeParse({
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyText"),
  });
  if (!content.success) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: content.error.issues[0]?.message || "Invalid content",
    };
  }

  const audienceParsed = broadcastAudienceSchema.safeParse(parseAudienceFromFormData(formData));
  if (!audienceParsed.success) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: audienceParsed.error.issues[0]?.message || "Invalid audience",
    };
  }

  const draftIdRaw = String(formData.get("draftId") || "").trim();
  let existingDraftId: string | null = null;
  let keepScheduled = false;
  if (draftIdRaw) {
    const draft = await prisma.broadcast.findUnique({ where: { id: draftIdRaw } });
    if (!draft || (draft.status !== "DRAFT" && draft.status !== "SCHEDULED")) {
      return {
        sent: null,
        failed: null,
        failedEmails: null,
        skippedUnsubscribed: null,
        error: "Draft not found (it may have already been sent by another admin).",
      };
    }
    existingDraftId = draft.id;
    keepScheduled = draft.status === "SCHEDULED";
  }

  const bodyText = content.data.bodyHtml;
  const targets = audienceTargetFields(audienceParsed.data);
  const delivered = await deliverBroadcast({
    subject: content.data.subject,
    bodyText,
    audience: audienceParsed.data,
    actorUserId: session.user.id,
    batchPrefix: `hub-broadcast/${session.user.id}/${Date.now()}`,
  });

  if (delivered.error !== null) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: delivered.error,
    };
  }

  const sentAt = new Date();
  if (keepScheduled && existingDraftId) {
    await prisma.broadcast.create({
      data: {
        subject: content.data.subject,
        bodyText,
        bodyHtml: delivered.bodyHtml,
        audienceLabel: delivered.label,
        recipientCount: delivered.sent,
        status: "SENT",
        createdById: session.user.id,
        sentById: session.user.id,
        sentAt,
        parentId: existingDraftId,
        ...targets,
      },
    });
    await prisma.broadcast.update({
      where: { id: existingDraftId },
      data: {
        subject: content.data.subject,
        bodyText,
        lastRunAt: sentAt,
        ...targets,
      },
    });
  } else if (existingDraftId) {
    await prisma.broadcast.update({
      where: { id: existingDraftId },
      data: {
        subject: content.data.subject,
        bodyText,
        bodyHtml: delivered.bodyHtml,
        audienceLabel: delivered.label,
        recipientCount: delivered.sent,
        status: "SENT",
        sentById: session.user.id,
        sentAt,
        ...targets,
      },
    });
  } else {
    await prisma.broadcast.create({
      data: {
        subject: content.data.subject,
        bodyText,
        bodyHtml: delivered.bodyHtml,
        audienceLabel: delivered.label,
        recipientCount: delivered.sent,
        status: "SENT",
        createdById: session.user.id,
        sentById: session.user.id,
        sentAt,
        ...targets,
      },
    });
  }

  revalidatePath("/admin/broadcast");
  return {
    sent: delivered.sent,
    failed: delivered.failed.length,
    failedEmails: delivered.failed.slice(0, 20),
    skippedUnsubscribed: delivered.skippedUnsubscribed,
    error: null,
  };
}

export type ScheduleBroadcastResult =
  | { scheduleId: string; nextRunAt: string; error: null }
  | { scheduleId: null; nextRunAt: null; error: string };

export async function scheduleBroadcastAction(formData: FormData): Promise<ScheduleBroadcastResult> {
  const session = await requireAdmin();

  const content = broadcastContentSchema.safeParse({
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyText"),
  });
  if (!content.success) {
    return {
      scheduleId: null,
      nextRunAt: null,
      error: content.error.issues[0]?.message || "Invalid content",
    };
  }

  const spam = scoreBroadcastContent(content.data.subject, content.data.bodyHtml);
  if (!spam.canSend) {
    return {
      scheduleId: null,
      nextRunAt: null,
      error: `Deliverability score ${spam.score}/100 is too low to schedule. Fix the flagged issues first.`,
    };
  }

  const audienceParsed = broadcastAudienceSchema.safeParse(parseAudienceFromFormData(formData));
  if (!audienceParsed.success) {
    return {
      scheduleId: null,
      nextRunAt: null,
      error: audienceParsed.error.issues[0]?.message || "Invalid audience",
    };
  }

  const scheduleParsed = scheduleBroadcastSchema.safeParse({
    recurrence: formData.get("recurrence"),
    scheduleHour: formData.get("scheduleHour"),
    scheduleMinute: formData.get("scheduleMinute"),
    scheduleWeekday: formData.get("scheduleWeekday") || null,
    scheduleMonthDay: formData.get("scheduleMonthDay") || null,
  });
  if (!scheduleParsed.success) {
    return {
      scheduleId: null,
      nextRunAt: null,
      error: scheduleParsed.error.issues[0]?.message || "Choose how often this should send",
    };
  }

  const preview = await resolveAudience(audienceParsed.data);
  if (preview.recipients.length === 0) {
    return {
      scheduleId: null,
      nextRunAt: null,
      error:
        preview.skippedUnsubscribed > 0
          ? "Everyone in that audience has unsubscribed from announcement emails."
          : "No recipients match that audience.",
    };
  }

  const targets = audienceTargetFields(audienceParsed.data);
  const schedule = scheduleWriteData({
    recurrence: scheduleParsed.data.recurrence,
    timezone: BROADCAST_TZ,
    scheduleHour: scheduleParsed.data.scheduleHour,
    scheduleMinute: scheduleParsed.data.scheduleMinute,
    scheduleWeekday: scheduleParsed.data.scheduleWeekday,
    scheduleMonthDay: scheduleParsed.data.scheduleMonthDay,
  });
  const bodyText = content.data.bodyHtml;
  const draftIdRaw = String(formData.get("draftId") || "").trim();

  if (draftIdRaw) {
    const existing = await prisma.broadcast.findUnique({ where: { id: draftIdRaw } });
    if (!existing || (existing.status !== "DRAFT" && existing.status !== "SCHEDULED")) {
      return {
        scheduleId: null,
        nextRunAt: null,
        error: "Draft not found (it may have already been sent).",
      };
    }
    await prisma.broadcast.update({
      where: { id: existing.id },
      data: {
        subject: content.data.subject,
        bodyText,
        bodyHtml: "",
        audienceLabel: preview.label,
        createdById: existing.createdById,
        sentById: null,
        sentAt: null,
        recipientCount: 0,
        ...targets,
        ...schedule,
      },
    });
    revalidatePath("/admin/broadcast");
    return {
      scheduleId: existing.id,
      nextRunAt: schedule.nextRunAt.toISOString(),
      error: null,
    };
  }

  const created = await prisma.broadcast.create({
    data: {
      subject: content.data.subject,
      bodyText,
      bodyHtml: "",
      audienceLabel: preview.label,
      recipientCount: 0,
      createdById: session.user.id,
      sentById: null,
      sentAt: null,
      ...targets,
      ...schedule,
    },
  });

  revalidatePath("/admin/broadcast");
  return {
    scheduleId: created.id,
    nextRunAt: schedule.nextRunAt.toISOString(),
    error: null,
  };
}

export async function pauseScheduledBroadcastAction(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const existing = await prisma.broadcast.findUnique({ where: { id } });
  if (!existing || existing.status !== "SCHEDULED") return { error: "Schedule not found" };
  if (existing.pausedAt) return { error: null };
  await prisma.broadcast.update({
    where: { id },
    data: { pausedAt: new Date() },
  });
  revalidatePath("/admin/broadcast");
  return { error: null };
}

export async function resumeScheduledBroadcastAction(id: string): Promise<{ error: string | null }> {
  await requireAdmin();
  const existing = await prisma.broadcast.findUnique({ where: { id } });
  if (!existing || existing.status !== "SCHEDULED") return { error: "Schedule not found" };
  if (existing.recurrence !== "DAILY" && existing.recurrence !== "WEEKLY" && existing.recurrence !== "MONTHLY") {
    return { error: "This broadcast is not recurring" };
  }
  const schedule = scheduleWriteData({
    recurrence: existing.recurrence,
    timezone: existing.timezone,
    scheduleHour: existing.scheduleHour,
    scheduleMinute: existing.scheduleMinute,
    scheduleWeekday: existing.scheduleWeekday,
    scheduleMonthDay: existing.scheduleMonthDay,
  });
  await prisma.broadcast.update({
    where: { id },
    data: { pausedAt: null, nextRunAt: schedule.nextRunAt },
  });
  revalidatePath("/admin/broadcast");
  return { error: null };
}

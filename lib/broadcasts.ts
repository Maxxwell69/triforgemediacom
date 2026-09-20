import type { BroadcastAudienceType, BroadcastRecurrence, BroadcastStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { paragraphsToHtml } from "@/lib/aiEmail";
import { sendBroadcastEmails, type BroadcastRecipient } from "@/lib/email";
import { scoreBroadcastContent } from "@/lib/broadcastSpamScore";
import { resolveNetworkTrackEmails, type NetworkTrack } from "@/lib/mnCn";
import {
  BROADCAST_TZ,
  nextBroadcastRunAt,
  type BroadcastRecurrenceKind,
} from "@/lib/broadcastSchedule";

export type Audience =
  | { audienceType: "ALL_MEMBERS" }
  | { audienceType: "TAG"; tagId: string }
  | { audienceType: "GROUP"; groupId: string }
  | { audienceType: "SINGLE_USER"; email: string }
  | { audienceType: "NETWORK_TRACK"; track: NetworkTrack };

export type AudienceResolve = {
  recipients: BroadcastRecipient[];
  label: string;
  skippedUnsubscribed: number;
};

const EMAILABLE_STATUSES: Array<"ACTIVE" | "INVITED"> = ["ACTIVE", "INVITED"];

function isEmailable(status: string): boolean {
  return status === "ACTIVE" || status === "INVITED";
}

async function filterOptedIn(rows: { id: string; email: string; broadcastEmailsOptIn: boolean }[]): Promise<{
  recipients: BroadcastRecipient[];
  skippedUnsubscribed: number;
}> {
  const recipients: BroadcastRecipient[] = [];
  let skippedUnsubscribed = 0;
  for (const row of rows) {
    if (!row.broadcastEmailsOptIn) {
      skippedUnsubscribed++;
      continue;
    }
    recipients.push({ userId: row.id, email: row.email });
  }
  return { recipients, skippedUnsubscribed };
}

export async function resolveAudience(audience: Audience): Promise<AudienceResolve> {
  if (audience.audienceType === "ALL_MEMBERS") {
    const users = await prisma.user.findMany({
      where: { status: { in: EMAILABLE_STATUSES } },
      select: { id: true, email: true, broadcastEmailsOptIn: true },
    });
    const filtered = await filterOptedIn(users);
    return { ...filtered, label: "All members" };
  }

  if (audience.audienceType === "TAG") {
    const tag = await prisma.tag.findUnique({
      where: { id: audience.tagId },
      include: {
        users: {
          include: {
            user: { select: { id: true, email: true, status: true, broadcastEmailsOptIn: true } },
          },
        },
      },
    });
    if (!tag) return { recipients: [], label: "Unknown tag", skippedUnsubscribed: 0 };
    const rows = tag.users.filter((ut) => isEmailable(ut.user.status)).map((ut) => ut.user);
    const filtered = await filterOptedIn(rows);
    return { ...filtered, label: `Tag: ${tag.name}` };
  }

  if (audience.audienceType === "GROUP") {
    const group = await prisma.group.findUnique({
      where: { id: audience.groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, email: true, status: true, broadcastEmailsOptIn: true } },
          },
        },
      },
    });
    if (!group) return { recipients: [], label: "Unknown group", skippedUnsubscribed: 0 };
    const rows = group.members.filter((m) => isEmailable(m.user.status)).map((m) => m.user);
    const filtered = await filterOptedIn(rows);
    return { ...filtered, label: `Group: ${group.name}` };
  }

  if (audience.audienceType === "NETWORK_TRACK") {
    const { emails, label } = await resolveNetworkTrackEmails(audience.track);
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, broadcastEmailsOptIn: true },
    });
    const filtered = await filterOptedIn(users);
    return { ...filtered, label };
  }

  const user = await prisma.user.findUnique({
    where: { email: audience.email.toLowerCase() },
    select: { id: true, email: true, broadcastEmailsOptIn: true },
  });
  if (!user) {
    return { recipients: [], label: `Single user: ${audience.email}`, skippedUnsubscribed: 0 };
  }
  const filtered = await filterOptedIn([user]);
  return { ...filtered, label: `Single user: ${audience.email}` };
}

export function parseAudienceFromFormData(formData: FormData): unknown {
  const audienceType = String(formData.get("audienceType"));
  if (audienceType === "TAG") {
    return { audienceType: "TAG" as const, tagId: String(formData.get("tagId") || "") };
  }
  if (audienceType === "GROUP") {
    return { audienceType: "GROUP" as const, groupId: String(formData.get("groupId") || "") };
  }
  if (audienceType === "SINGLE_USER") {
    return { audienceType: "SINGLE_USER" as const, email: String(formData.get("email") || "") };
  }
  if (audienceType === "NETWORK_TRACK") {
    return {
      audienceType: "NETWORK_TRACK" as const,
      track: String(formData.get("track") || "") as NetworkTrack,
    };
  }
  return { audienceType: "ALL_MEMBERS" as const };
}

export function audienceTargetFields(audience: Audience): {
  audienceType: BroadcastAudienceType;
  audienceTagId: string | null;
  audienceGroupId: string | null;
  audienceTrack: string | null;
  audienceEmail: string | null;
} {
  return {
    audienceType: audience.audienceType,
    audienceTagId: audience.audienceType === "TAG" ? audience.tagId : null,
    audienceGroupId: audience.audienceType === "GROUP" ? audience.groupId : null,
    audienceTrack: audience.audienceType === "NETWORK_TRACK" ? audience.track : null,
    audienceEmail: audience.audienceType === "SINGLE_USER" ? audience.email.toLowerCase() : null,
  };
}

export function audienceFromBroadcast(row: {
  audienceType: BroadcastAudienceType;
  audienceTagId: string | null;
  audienceGroupId: string | null;
  audienceTrack: string | null;
  audienceEmail: string | null;
}): Audience | null {
  if (row.audienceType === "TAG") {
    if (!row.audienceTagId) return null;
    return { audienceType: "TAG", tagId: row.audienceTagId };
  }
  if (row.audienceType === "GROUP") {
    if (!row.audienceGroupId) return null;
    return { audienceType: "GROUP", groupId: row.audienceGroupId };
  }
  if (row.audienceType === "NETWORK_TRACK") {
    if (row.audienceTrack !== "CN" && row.audienceTrack !== "MN") return null;
    return { audienceType: "NETWORK_TRACK", track: row.audienceTrack };
  }
  if (row.audienceType === "SINGLE_USER") {
    if (!row.audienceEmail) return null;
    return { audienceType: "SINGLE_USER", email: row.audienceEmail };
  }
  return { audienceType: "ALL_MEMBERS" };
}

export function bodyTextToHtml(bodyText: string) {
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphsToHtml(paragraphs);
}

export type DeliverBroadcastResult =
  | {
      sent: number;
      failed: string[];
      skippedUnsubscribed: number;
      label: string;
      bodyHtml: string;
      error: null;
    }
  | {
      sent: null;
      failed: null;
      skippedUnsubscribed: null;
      label: null;
      bodyHtml: null;
      error: string;
    };

export async function deliverBroadcast(opts: {
  subject: string;
  bodyText: string;
  audience: Audience;
  actorUserId: string;
  batchPrefix: string;
  skipSpamCheck?: boolean;
}): Promise<DeliverBroadcastResult> {
  if (!opts.skipSpamCheck) {
    const spam = scoreBroadcastContent(opts.subject, opts.bodyText);
    if (!spam.canSend) {
      const top = spam.issues
        .filter((i) => i.severity === "block" || i.severity === "warn")
        .slice(0, 3)
        .map((i) => i.text)
        .join(" ");
      return {
        sent: null,
        failed: null,
        skippedUnsubscribed: null,
        label: null,
        bodyHtml: null,
        error: `Deliverability score ${spam.score}/100 is too low to send. ${top || "Fix the flagged issues and try again."}`,
      };
    }
  }

  const { recipients, label, skippedUnsubscribed } = await resolveAudience(opts.audience);
  if (recipients.length === 0) {
    return {
      sent: null,
      failed: null,
      skippedUnsubscribed: null,
      label: null,
      bodyHtml: null,
      error:
        skippedUnsubscribed > 0
          ? "Everyone in that audience has unsubscribed from announcement emails."
          : "No recipients match that audience.",
    };
  }

  const bodyHtml = bodyTextToHtml(opts.bodyText);
  let sent: number;
  let failed: string[];
  try {
    ({ sent, failed } = await sendBroadcastEmails(
      recipients,
      opts.subject,
      bodyHtml,
      opts.batchPrefix
    ));
  } catch (err) {
    return {
      sent: null,
      failed: null,
      skippedUnsubscribed: null,
      label: null,
      bodyHtml: null,
      error: err instanceof Error ? err.message : "Broadcast failed — no emails were sent.",
    };
  }

  if (sent === 0) {
    return {
      sent: null,
      failed: null,
      skippedUnsubscribed: null,
      label: null,
      bodyHtml: null,
      error:
        failed.length > 0
          ? `Broadcast failed for all ${failed.length} recipients (check Resend rate limits / API key).`
          : "Broadcast failed — no emails were sent.",
    };
  }

  return {
    sent,
    failed,
    skippedUnsubscribed,
    label,
    bodyHtml,
    error: null,
  };
}

export type ScheduleFields = {
  recurrence: BroadcastRecurrenceKind;
  timezone?: string;
  scheduleHour: number;
  scheduleMinute: number;
  scheduleWeekday?: number | null;
  scheduleMonthDay?: number | null;
};

export function scheduleWriteData(fields: ScheduleFields, after = new Date()) {
  const timezone = fields.timezone || BROADCAST_TZ;
  const nextRunAt = nextBroadcastRunAt(
    {
      recurrence: fields.recurrence,
      hour: fields.scheduleHour,
      minute: fields.scheduleMinute,
      weekday: fields.scheduleWeekday,
      monthDay: fields.scheduleMonthDay,
      timeZone: timezone,
    },
    after
  );
  return {
    recurrence: fields.recurrence as BroadcastRecurrence,
    timezone,
    scheduleHour: fields.scheduleHour,
    scheduleMinute: fields.scheduleMinute,
    scheduleWeekday: fields.recurrence === "WEEKLY" ? fields.scheduleWeekday ?? 1 : null,
    scheduleMonthDay: fields.recurrence === "MONTHLY" ? fields.scheduleMonthDay ?? 1 : null,
    nextRunAt,
    pausedAt: null as Date | null,
    status: "SCHEDULED" as BroadcastStatus,
  };
}

export async function runDueScheduledBroadcasts(now = new Date()) {
  const due = await prisma.broadcast.findMany({
    where: {
      status: "SCHEDULED",
      pausedAt: null,
      nextRunAt: { lte: now },
    },
    orderBy: { nextRunAt: "asc" },
    take: 8,
  });

  let ran = 0;
  let sent = 0;
  const errors: string[] = [];

  for (const row of due) {
    if (row.recurrence === "NONE") continue;
    const audience = audienceFromBroadcast(row);
    if (!audience) {
      errors.push(`${row.id}: invalid audience`);
      continue;
    }

    const claimed = await prisma.broadcast.updateMany({
      where: {
        id: row.id,
        status: "SCHEDULED",
        pausedAt: null,
        nextRunAt: row.nextRunAt,
      },
      data: {
        nextRunAt: nextBroadcastRunAt(
          {
            recurrence: row.recurrence,
            hour: row.scheduleHour,
            minute: row.scheduleMinute,
            weekday: row.scheduleWeekday,
            monthDay: row.scheduleMonthDay,
            timeZone: row.timezone,
          },
          now
        ),
      },
    });
    if (claimed.count !== 1) continue;

    const result = await deliverBroadcast({
      subject: row.subject,
      bodyText: row.bodyText,
      audience,
      actorUserId: row.createdById,
      batchPrefix: `hub-broadcast/cron/${row.id}/${now.getTime()}`,
      skipSpamCheck: true,
    });

    if (result.error !== null) {
      await prisma.broadcast.update({
        where: { id: row.id },
        data: { nextRunAt: row.nextRunAt },
      });
      errors.push(`${row.subject}: ${result.error}`);
      continue;
    }

    await prisma.broadcast.create({
      data: {
        subject: row.subject,
        bodyText: row.bodyText,
        bodyHtml: result.bodyHtml,
        audienceLabel: result.label,
        recipientCount: result.sent,
        status: "SENT",
        createdById: row.createdById,
        sentById: row.createdById,
        sentAt: now,
        parentId: row.id,
        ...audienceTargetFields(audience),
      },
    });
    await prisma.broadcast.update({
      where: { id: row.id },
      data: { lastRunAt: now, recipientCount: result.sent },
    });
    ran++;
    sent += result.sent;
  }

  return { due: due.length, ran, sent, errors };
}

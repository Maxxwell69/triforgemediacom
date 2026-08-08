"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { generateBroadcastDraft, paragraphsToHtml } from "@/lib/aiEmail";
import { sendBroadcastEmails, type BroadcastRecipient } from "@/lib/email";
import { scoreBroadcastContent } from "@/lib/broadcastSpamScore";
import {
  broadcastAudienceSchema,
  broadcastContentSchema,
  broadcastDraftSchema,
} from "@/lib/validations/broadcast";
import { resolveNetworkTrackEmails, type NetworkTrack } from "@/lib/mnCn";

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

type Audience =
  | { audienceType: "ALL_MEMBERS" }
  | { audienceType: "TAG"; tagId: string }
  | { audienceType: "GROUP"; groupId: string }
  | { audienceType: "SINGLE_USER"; email: string }
  | { audienceType: "NETWORK_TRACK"; track: NetworkTrack };

const EMAILABLE_STATUSES: Array<"ACTIVE" | "INVITED"> = ["ACTIVE", "INVITED"];

function isEmailable(status: string): boolean {
  return status === "ACTIVE" || status === "INVITED";
}

type AudienceResolve = {
  recipients: BroadcastRecipient[];
  label: string;
  skippedUnsubscribed: number;
};

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

async function resolveAudience(audience: Audience): Promise<AudienceResolve> {
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
    const rows = tag.users
      .filter((ut) => isEmailable(ut.user.status))
      .map((ut) => ut.user);
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
    const rows = group.members
      .filter((m) => isEmailable(m.user.status))
      .map((m) => m.user);
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
      sentById: session.user.id,
      sentAt: { gt: new Date(Date.now() - BROADCAST_COOLDOWN_MS) },
    },
    orderBy: { sentAt: "desc" },
  });
  if (recentBroadcast) {
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

  const spam = scoreBroadcastContent(content.data.subject, content.data.bodyHtml);
  if (!spam.canSend) {
    const top = spam.issues
      .filter((i) => i.severity === "block" || i.severity === "warn")
      .slice(0, 3)
      .map((i) => i.text)
      .join(" ");
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: `Deliverability score ${spam.score}/100 is too low to send. ${top || "Fix the flagged issues and try again."}`,
    };
  }

  const audienceType = String(formData.get("audienceType"));
  const audienceInput =
    audienceType === "TAG"
      ? { audienceType: "TAG" as const, tagId: String(formData.get("tagId") || "") }
      : audienceType === "GROUP"
        ? { audienceType: "GROUP" as const, groupId: String(formData.get("groupId") || "") }
        : audienceType === "SINGLE_USER"
          ? { audienceType: "SINGLE_USER" as const, email: String(formData.get("email") || "") }
          : audienceType === "NETWORK_TRACK"
            ? {
                audienceType: "NETWORK_TRACK" as const,
                track: String(formData.get("track") || "") as NetworkTrack,
              }
            : { audienceType: "ALL_MEMBERS" as const };

  const audienceParsed = broadcastAudienceSchema.safeParse(audienceInput);
  if (!audienceParsed.success) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error: audienceParsed.error.issues[0]?.message || "Invalid audience",
    };
  }

  const { recipients, label, skippedUnsubscribed } = await resolveAudience(audienceParsed.data);
  if (recipients.length === 0) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error:
        skippedUnsubscribed > 0
          ? "Everyone in that audience has unsubscribed from announcement emails."
          : "No recipients match that audience.",
    };
  }

  const paragraphs = content.data.bodyHtml
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyHtml = paragraphsToHtml(paragraphs);

  const batchPrefix = `hub-broadcast/${session.user.id}/${Date.now()}`;
  const { sent, failed } = await sendBroadcastEmails(
    recipients,
    content.data.subject,
    bodyHtml,
    batchPrefix
  );

  if (sent === 0) {
    return {
      sent: null,
      failed: null,
      failedEmails: null,
      skippedUnsubscribed: null,
      error:
        failed.length > 0
          ? `Broadcast failed for all ${failed.length} recipients (check Resend rate limits / API key).`
          : "Broadcast failed — no emails were sent.",
    };
  }

  await prisma.broadcast.create({
    data: {
      subject: content.data.subject,
      bodyHtml,
      audienceType: audienceParsed.data.audienceType,
      audienceLabel: label,
      recipientCount: sent,
      sentById: session.user.id,
    },
  });

  revalidatePath("/admin/broadcast");
  return {
    sent,
    failed: failed.length,
    failedEmails: failed.slice(0, 20),
    skippedUnsubscribed,
    error: null,
  };
}

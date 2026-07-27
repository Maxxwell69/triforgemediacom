"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { generateBroadcastDraft, paragraphsToHtml } from "@/lib/aiEmail";
import { sendBroadcastEmail } from "@/lib/email";
import {
  broadcastAudienceSchema,
  broadcastContentSchema,
  broadcastDraftSchema,
} from "@/lib/validations/broadcast";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export type BroadcastDraftResult = { subject: string; bodyText: string; error: null } | { subject: null; bodyText: null; error: string };

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
  | { audienceType: "SINGLE_USER"; email: string };

async function resolveAudience(
  audience: Audience
): Promise<{ emails: string[]; label: string }> {
  if (audience.audienceType === "ALL_MEMBERS") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { email: true },
    });
    return { emails: users.map((u) => u.email), label: "All active members" };
  }

  if (audience.audienceType === "TAG") {
    const tag = await prisma.tag.findUnique({
      where: { id: audience.tagId },
      include: { users: { include: { user: { select: { email: true, status: true } } } } },
    });
    if (!tag) return { emails: [], label: "Unknown tag" };
    const emails = tag.users
      .filter((ut) => ut.user.status === "ACTIVE")
      .map((ut) => ut.user.email);
    return { emails, label: `Tag: ${tag.name}` };
  }

  if (audience.audienceType === "GROUP") {
    const group = await prisma.group.findUnique({
      where: { id: audience.groupId },
      include: { members: { include: { user: { select: { email: true, status: true } } } } },
    });
    if (!group) return { emails: [], label: "Unknown group" };
    const emails = group.members
      .filter((m) => m.user.status === "ACTIVE")
      .map((m) => m.user.email);
    return { emails, label: `Group: ${group.name}` };
  }

  const user = await prisma.user.findUnique({ where: { email: audience.email.toLowerCase() } });
  return {
    emails: user ? [user.email] : [],
    label: `Single user: ${audience.email}`,
  };
}

export type SendBroadcastResult = { sent: number; error: null } | { sent: null; error: string };

export async function sendBroadcastAction(formData: FormData): Promise<SendBroadcastResult> {
  const session = await requireAdmin();

  const content = broadcastContentSchema.safeParse({
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyText"),
  });
  if (!content.success) {
    return { sent: null, error: content.error.issues[0]?.message || "Invalid content" };
  }

  const audienceType = String(formData.get("audienceType"));
  const audienceInput =
    audienceType === "TAG"
      ? { audienceType: "TAG" as const, tagId: String(formData.get("tagId") || "") }
      : audienceType === "GROUP"
        ? { audienceType: "GROUP" as const, groupId: String(formData.get("groupId") || "") }
        : audienceType === "SINGLE_USER"
          ? { audienceType: "SINGLE_USER" as const, email: String(formData.get("email") || "") }
          : { audienceType: "ALL_MEMBERS" as const };

  const audienceParsed = broadcastAudienceSchema.safeParse(audienceInput);
  if (!audienceParsed.success) {
    return { sent: null, error: audienceParsed.error.issues[0]?.message || "Invalid audience" };
  }

  const { emails, label } = await resolveAudience(audienceParsed.data);
  if (emails.length === 0) {
    return { sent: null, error: "No recipients match that audience." };
  }

  const paragraphs = content.data.bodyHtml
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyHtml = paragraphsToHtml(paragraphs);

  let sent = 0;
  const BATCH_SIZE = 25;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((to) => sendBroadcastEmail(to, content.data.subject, bodyHtml))
    );
    sent += results.filter((r) => r.status === "fulfilled").length;
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
  return { sent, error: null };
}

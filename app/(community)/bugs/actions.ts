"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { createBugReportSchema } from "@/lib/validations/bugReport";
import {
  BUG_PLATFORM_LABELS,
  BUG_STATUS_LABELS,
  formatBugDateTime,
  formatBugTicket,
} from "@/lib/bugs";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { sendBugReportedAdminAlert } from "@/lib/email";
import { isR2Configured, uploadImage } from "@/lib/r2";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/uploadConstraints";

export async function createBugReportAction(formData: FormData) {
  const { user } = await requireProfile();

  const parsed = createBugReportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    platform: formData.get("platform"),
    pageUrl: formData.get("pageUrl") ?? "",
  });
  if (!parsed.success) {
    redirect(
      `/bugs?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid report")}`
    );
  }

  let screenshotUrl: string | null = null;
  const file = formData.get("screenshot");
  if (file instanceof File && file.size > 0) {
    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
      )
    ) {
      redirect(
        `/bugs?error=${encodeURIComponent("Screenshot must be JPG, PNG, WEBP, or GIF.")}`
      );
    }
    if (!isR2Configured()) {
      redirect(
        `/bugs?error=${encodeURIComponent("Screenshot uploads aren't configured yet — submit without an image for now.")}`
      );
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      screenshotUrl = await uploadImage("bug-screenshots", {
        buffer,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't upload screenshot";
      redirect(`/bugs?error=${encodeURIComponent(message)}`);
    }
  }

  const pageUrl = parsed.data.pageUrl?.trim() || null;

  const report = await prisma.bugReport.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      platform: parsed.data.platform,
      pageUrl,
      screenshotUrl,
      reporterId: user.id,
      status: "REPORTED",
      reportedAt: new Date(),
    },
  });

  const reporter = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      profile: { select: { socialLinks: true, username: true, showRealName: true } },
      tiktokConnection: { select: { displayName: true, avatarUrl: true } },
      tiktokStatsSnapshot: { select: { nickname: true, avatarUrl: true, uniqueId: true } },
    },
  });

  const reporterName = reporter
    ? getMemberDisplayName(reporter)
    : user.name || user.email || "Member";

  try {
    const admins = await getAlertableAdminEmails();
    await sendBugReportedAdminAlert(admins, {
      title: report.title,
      description: report.description,
      reporterName,
      statusLabel: BUG_STATUS_LABELS.REPORTED,
      reportId: report.id,
      ticketLabel: formatBugTicket(report.ticketNumber),
      reportedAtLabel: formatBugDateTime(report.reportedAt),
      platformLabel: BUG_PLATFORM_LABELS[report.platform],
      pageUrl: report.pageUrl,
      screenshotUrl: report.screenshotUrl,
    });
  } catch (err) {
    console.error("Failed to send bug-reported admin alert:", err);
  }

  revalidatePath("/bugs");
  revalidatePath("/admin/bugs");
  redirect(`/bugs?submitted=1&ticket=${encodeURIComponent(formatBugTicket(report.ticketNumber))}`);
}

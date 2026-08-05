"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { createBugReportSchema } from "@/lib/validations/bugReport";
import { BUG_STATUS_LABELS, formatBugDateTime } from "@/lib/bugs";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { sendBugReportedAdminAlert } from "@/lib/email";

export async function createBugReportAction(formData: FormData) {
  const { user } = await requireProfile();

  const parsed = createBugReportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    redirect(
      `/bugs?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid report")}`
    );
  }

  const report = await prisma.bugReport.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
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
      reportedAtLabel: formatBugDateTime(report.reportedAt),
    });
  } catch (err) {
    console.error("Failed to send bug-reported admin alert:", err);
  }

  revalidatePath("/bugs");
  revalidatePath("/admin/bugs");
  redirect("/bugs?submitted=1");
}

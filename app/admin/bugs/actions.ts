"use server";

import { revalidatePath } from "next/cache";
import type { BugReportStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { updateBugReportSchema } from "@/lib/validations/bugReport";
import {
  BUG_STATUS_LABELS,
  formatBugDateTime,
  formatBugFixDuration,
} from "@/lib/bugs";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { sendBugFixedAdminAlert } from "@/lib/email";
import { importBugChannelMessages } from "@/lib/importBugChannel";
import { redirect } from "next/navigation";

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
  return session;
}

function parseDateTimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function updateBugReportAction(formData: FormData) {
  await requireAdmin();

  const parsed = updateBugReportSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    reportedAt: formData.get("reportedAt"),
    fixedAt: formData.get("fixedAt") ?? "",
    adminNotes: formData.get("adminNotes") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid update");
  }

  const existing = await prisma.bugReport.findUnique({
    where: { id: parsed.data.id },
    include: {
      reporter: {
        select: {
          id: true,
          name: true,
          profile: { select: { socialLinks: true, username: true, showRealName: true } },
          tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          tiktokStatsSnapshot: {
            select: { nickname: true, avatarUrl: true, uniqueId: true },
          },
        },
      },
    },
  });
  if (!existing) throw new Error("Bug report not found");

  const reportedAt = parseDateTimeLocal(parsed.data.reportedAt);
  if (!reportedAt) throw new Error("Invalid reported time");

  const status = parsed.data.status as BugReportStatus;
  let fixedAt = parseDateTimeLocal(parsed.data.fixedAt || "");

  if (status === "FIXED") {
    if (!fixedAt) fixedAt = existing.fixedAt ?? new Date();
  } else if (!parsed.data.fixedAt) {
    fixedAt = null;
  }

  const updated = await prisma.bugReport.update({
    where: { id: existing.id },
    data: {
      status,
      reportedAt,
      fixedAt,
      adminNotes: parsed.data.adminNotes?.trim() || null,
    },
  });

  const becameFixed = existing.status !== "FIXED" && updated.status === "FIXED";
  if (becameFixed) {
    try {
      const admins = await getAlertableAdminEmails();
      await sendBugFixedAdminAlert(admins, {
        title: updated.title,
        description: updated.description,
        reporterName: getMemberDisplayName(existing.reporter),
        statusLabel: BUG_STATUS_LABELS.FIXED,
        reportId: updated.id,
        reportedAtLabel: formatBugDateTime(updated.reportedAt),
        fixedAtLabel: updated.fixedAt ? formatBugDateTime(updated.fixedAt) : null,
        durationLabel: formatBugFixDuration(updated.reportedAt, updated.fixedAt),
      });
    } catch (err) {
      console.error("Failed to send bug-fixed admin alert:", err);
    }
  }

  revalidatePath("/admin/bugs");
  revalidatePath("/bugs");
}

export async function deleteBugReportAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");
  await prisma.bugReport.delete({ where: { id } });
  revalidatePath("/admin/bugs");
  revalidatePath("/bugs");
}

/** One-time (safe to re-run) import of legacy #bugs chat into Hub Bug. */
export async function importBugChannelAction() {
  await requireAdmin();
  const result = await importBugChannelMessages();
  revalidatePath("/admin/bugs");
  revalidatePath("/bugs");

  if (!result.channelName) {
    redirect(
      `/admin/bugs?import=missing&msg=${encodeURIComponent("No #bugs chat channel found in this database.")}`
    );
  }

  redirect(
    `/admin/bugs?import=ok&msg=${encodeURIComponent(
      `Imported ${result.imported} from #${result.channelName} (${result.skipped} skipped, ${result.scanned} scanned).`
    )}`
  );
}

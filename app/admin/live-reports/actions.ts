"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  addAgencyLiveReportNote,
  addAgencyRosterMember,
  monthParam,
  parseMonthParam,
  removeAgencyRosterMember,
  runAgencyLiveReport,
  searchAgencyRosterCandidates,
} from "@/lib/agencyLiveReports";

export type LiveReportFormState = { error?: string; ok?: string } | null;

async function requireLiveReportsAdmin() {
  if (!hubHas("agencyLiveReports")) {
    throw new Error("LIVE reports are not enabled on this hub");
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
  return dbUser;
}

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function actionError(err: unknown, fallback: string): LiveReportFormState {
  console.error(fallback, err);
  return { error: err instanceof Error ? err.message : fallback };
}

function revalidateLiveReports(userId?: string) {
  revalidatePath("/admin/live-reports");
  if (userId) revalidatePath(`/admin/live-reports/${userId}`);
}

export async function searchLiveRosterCandidates(q: string) {
  await requireLiveReportsAdmin();
  return searchAgencyRosterCandidates(q);
}

export async function addLiveRosterMember(
  _prev: LiveReportFormState,
  formData: FormData
): Promise<LiveReportFormState> {
  try {
    const admin = await requireLiveReportsAdmin();
    const userId = field(formData, "userId");
    if (!userId) return { error: "Pick a member to add" };
    await addAgencyRosterMember(userId, admin.id);
    revalidateLiveReports();
    return { ok: "Added to LIVE reports" };
  } catch (err) {
    return actionError(err, "Could not add that member");
  }
}

export async function removeLiveRosterMemberAction(
  _prev: LiveReportFormState,
  formData: FormData
): Promise<LiveReportFormState> {
  try {
    await requireLiveReportsAdmin();
    const userId = field(formData, "userId");
    if (!userId) return { error: "Missing member" };
    await removeAgencyRosterMember(userId);
    revalidateLiveReports(userId);
    return { ok: "Removed from roster" };
  } catch (err) {
    return actionError(err, "Could not remove that member");
  }
}

export async function runLiveReportAction(
  _prev: LiveReportFormState,
  formData: FormData
): Promise<LiveReportFormState> {
  try {
    const admin = await requireLiveReportsAdmin();
    const userId = field(formData, "userId");
    const { year, month } = parseMonthParam(field(formData, "month"));
    if (!userId) return { error: "Missing member" };
    await runAgencyLiveReport({ userId, year, month, ranById: admin.id });
    revalidateLiveReports(userId);
  } catch (err) {
    return actionError(err, "Could not run the report");
  }
  const userId = field(formData, "userId");
  const { year, month } = parseMonthParam(field(formData, "month"));
  redirect(`/admin/live-reports/${userId}?month=${monthParam(year, month)}`);
}

export async function addLiveReportNoteAction(
  _prev: LiveReportFormState,
  formData: FormData
): Promise<LiveReportFormState> {
  try {
    const admin = await requireLiveReportsAdmin();
    const reportId = field(formData, "reportId");
    const userId = field(formData, "userId");
    const body = field(formData, "body");
    if (!reportId) return { error: "Run the report first, then add a note" };
    await addAgencyLiveReportNote(reportId, admin.id, body);
    revalidateLiveReports(userId || undefined);
    return { ok: "Note added" };
  } catch (err) {
    return actionError(err, "Could not save the note");
  }
}

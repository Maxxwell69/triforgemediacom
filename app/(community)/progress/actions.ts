"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/session";
import { hubHas } from "@/lib/hub/modules";
import { prisma } from "@/lib/prisma";
import { getUserNetworkTrack } from "@/lib/mnCn";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { sendProgressionApplicationAdminAlert } from "@/lib/email";
import { progressionApplySchema } from "@/lib/validations/progression";
import { completeLearningModule, completeMission, chooseSpecialty, resetSpecialty, submitProgressionQuiz } from "@/lib/progression/engine";
import {
  enrollAsRecruit,
  isProgressionEnrolled,
  maybeAutoEnrollProgression,
  requireMemberProgressionPage,
  requireProgressionEnrolled,
} from "@/lib/progression/access";

async function requireProgressionMember() {
  if (!hubHas("progression")) throw new Error("Not available");
  const { user } = await requireProfile();
  await requireMemberProgressionPage(user.role);
  await maybeAutoEnrollProgression(user.id, user.role);
  await requireProgressionEnrolled(user.id);
  return user;
}

export async function applyToProgression(formData: FormData): Promise<{ error?: string }> {
  if (!hubHas("progression")) return { error: "Not available" };
  const { user } = await requireProfile();
  await requireMemberProgressionPage(user.role);
  await maybeAutoEnrollProgression(user.id, user.role);
  if (await isProgressionEnrolled(user.id)) {
    revalidatePath("/progress");
    return {};
  }

  const track = await getUserNetworkTrack(user.id);
  if (track === "CN") {
    await enrollAsRecruit(user.id);
    revalidatePath("/progress");
    return {};
  }

  const parsed = progressionApplySchema.safeParse({
    whyJoin: formData.get("whyJoin"),
    goals: formData.get("goals") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid form" };
  }

  const existing = await prisma.progressionApplication.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });
  if (existing?.status === "PENDING") {
    return { error: "Your application is already pending review." };
  }
  if (existing?.status === "APPROVED") {
    await enrollAsRecruit(user.id);
    revalidatePath("/progress");
    return {};
  }

  const application = await prisma.progressionApplication.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      whyJoin: parsed.data.whyJoin,
      goals: parsed.data.goals || null,
      status: "PENDING",
    },
    update: {
      whyJoin: parsed.data.whyJoin,
      goals: parsed.data.goals || null,
      status: "PENDING",
      reviewNotes: null,
      reviewedById: null,
      reviewedAt: null,
    },
  });

  try {
    const admins = await getAlertableAdminEmails();
    await sendProgressionApplicationAdminAlert(admins, {
      name: user.name || user.email || "Member",
      email: user.email || "",
      whyJoin: application.whyJoin,
      goals: application.goals,
    });
  } catch (err) {
    console.error("Failed to send progression application admin alert:", err);
  }

  revalidatePath("/progress");
  revalidatePath("/admin/progression/applications");
  return {};
}

export async function chooseMySpecialty(missionId: string) {
  const user = await requireProgressionMember();
  await chooseSpecialty(user.id, missionId);
  revalidatePath("/progress");
}

export async function resetMySpecialty() {
  const user = await requireProgressionMember();
  await resetSpecialty(user.id);
  revalidatePath("/progress");
}

export async function completeMyMission(missionId: string) {
  const user = await requireProgressionMember();
  await completeMission(user.id, missionId);
  revalidatePath("/progress");
}

export async function completeMyModule(moduleId: string) {
  const user = await requireProgressionMember();
  await completeLearningModule(user.id, moduleId);
  revalidatePath("/progress");
  revalidatePath(`/progress/learn/${moduleId}`);
}

export async function submitMyQuiz(formData: FormData) {
  const user = await requireProgressionMember();
  const quizId = String(formData.get("quizId") || "");
  const count = Number(formData.get("questionCount") || 0);
  const answers: number[] = [];
  for (let i = 0; i < count; i += 1) {
    answers.push(Number(formData.get(`a${i}`) || -1));
  }
  await submitProgressionQuiz(user.id, quizId, answers);
  revalidatePath("/progress", "layout");
}

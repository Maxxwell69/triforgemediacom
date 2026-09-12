"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  onboardingModuleSettingsSchema,
  onboardingProgramSchema,
  onboardingStepSchema,
} from "@/lib/validations/onboardingChecklist";
import { DEFAULT_ONBOARDING_DISCLAIMER, getOnboardingProgram } from "@/lib/onboarding/config";

export type OnboardingFormState = { error?: string; ok?: string } | null;

function fieldString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function actionError(err: unknown, fallback: string) {
  console.error(fallback, err);
  return { error: err instanceof Error ? err.message : fallback };
}

async function requireAdmin() {
  if (!hubHas("onboardingChecklist")) {
    throw new Error("Onboarding is not enabled");
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

function revalidateOnboarding(programId?: string, userId?: string) {
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/users");
  revalidatePath("/home");
  revalidatePath("/account");
  if (programId) revalidatePath(`/admin/onboarding/${programId}`);
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

function parseStep(formData: FormData) {
  return onboardingStepSchema.safeParse({
    title: fieldString(formData, "title"),
    description: fieldString(formData, "description"),
    trackScope: fieldString(formData, "trackScope") || "ALL",
    actionType: fieldString(formData, "actionType") || "CONFIRM",
    actionTarget: fieldString(formData, "actionTarget"),
    xpReward: fieldString(formData, "xpReward") || "10",
  });
}

export async function createOnboardingProgram(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  try {
    await requireAdmin();
    const parsed = onboardingProgramSchema.safeParse({
      title: fieldString(formData, "title"),
      description: fieldString(formData, "description"),
      kind: fieldString(formData, "kind") || "CUSTOM",
      assignOnFirstLogin: formData.get("assignOnFirstLogin") ? "on" : "false",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid checklist" };
    }
    const created = await prisma.onboardingModule.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        kind: parsed.data.kind,
        assignOnFirstLogin:
          parsed.data.assignOnFirstLogin === "on" || parsed.data.assignOnFirstLogin === "true",
        enabled: true,
        dismissalDisclaimerText: DEFAULT_ONBOARDING_DISCLAIMER,
      },
    });
    revalidateOnboarding(created.id);
    redirect(`/admin/onboarding/${created.id}`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    return actionError(err, "Could not create checklist");
  }
}

export async function deleteOnboardingProgram(formData: FormData) {
  try {
    await requireAdmin();
    const programId = fieldString(formData, "programId");
    if (!programId) return;
    await prisma.onboardingModule.delete({ where: { id: programId } });
    revalidateOnboarding();
  } catch (err) {
    console.error("deleteOnboardingProgram failed:", err);
  }
  redirect("/admin/onboarding");
}

export async function updateOnboardingSettings(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  try {
    await requireAdmin();
    const parsed = onboardingModuleSettingsSchema.safeParse({
      programId: fieldString(formData, "programId"),
      title: fieldString(formData, "title"),
      description: fieldString(formData, "description"),
      kind: fieldString(formData, "kind") || "CUSTOM",
      assignOnFirstLogin: formData.get("assignOnFirstLogin") ? "on" : "false",
      enabled: formData.get("enabled") ? "on" : "false",
      dismissalDisclaimerText: fieldString(formData, "dismissalDisclaimerText"),
      requiredCourseIds: formData.getAll("requiredCourseIds").filter((v): v is string => typeof v === "string"),
      completionXpReward: fieldString(formData, "completionXpReward") || "50",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid settings" };
    }
    await prisma.onboardingModule.update({
      where: { id: parsed.data.programId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        kind: parsed.data.kind,
        assignOnFirstLogin:
          parsed.data.assignOnFirstLogin === "on" || parsed.data.assignOnFirstLogin === "true",
        enabled: parsed.data.enabled === "on" || parsed.data.enabled === "true",
        dismissalDisclaimerText: parsed.data.dismissalDisclaimerText,
        requiredCourseIds: parsed.data.requiredCourseIds ?? [],
        completionXpReward: parsed.data.completionXpReward,
      },
    });
    revalidateOnboarding(parsed.data.programId);
    return { ok: "Settings saved." };
  } catch (err) {
    return actionError(err, "Could not save settings");
  }
}

export async function createOnboardingStep(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  try {
    await requireAdmin();
    const programId = fieldString(formData, "programId");
    const program = await getOnboardingProgram(programId);
    if (!program) return { error: "Checklist not found" };
    const parsed = parseStep(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid step" };
    }
    const last = program.steps[program.steps.length - 1];
    await prisma.onboardingStep.create({
      data: {
        moduleId: program.id,
        order: (last?.order ?? 0) + 1,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        trackScope: parsed.data.trackScope,
        actionType: parsed.data.actionType,
        actionTarget: parsed.data.actionTarget?.trim() || null,
        xpReward: parsed.data.xpReward,
      },
    });
    revalidateOnboarding(program.id);
    return { ok: "Step added." };
  } catch (err) {
    return actionError(err, "Could not add step");
  }
}

export async function updateOnboardingStep(formData: FormData) {
  try {
    const stepId = fieldString(formData, "stepId");
    if (!stepId) return;
    await requireAdmin();
    const parsed = parseStep(formData);
    if (!parsed.success) {
      console.error("updateOnboardingStep invalid:", parsed.error.issues[0]?.message);
      return;
    }
    const updated = await prisma.onboardingStep.update({
      where: { id: stepId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        trackScope: parsed.data.trackScope,
        actionType: parsed.data.actionType,
        actionTarget: parsed.data.actionTarget?.trim() || null,
        xpReward: parsed.data.xpReward,
      },
    });
    revalidateOnboarding(updated.moduleId);
  } catch (err) {
    console.error("updateOnboardingStep failed:", err);
  }
}

export async function deleteOnboardingStep(formData: FormData) {
  try {
    await requireAdmin();
    const stepId = fieldString(formData, "stepId");
    if (!stepId) return;
    const step = await prisma.onboardingStep.delete({ where: { id: stepId } });
    revalidateOnboarding(step.moduleId);
  } catch (err) {
    console.error("deleteOnboardingStep failed:", err);
  }
}

export async function moveOnboardingStep(formData: FormData) {
  try {
    await requireAdmin();
    const stepId = fieldString(formData, "stepId");
    const direction = fieldString(formData, "direction") === "down" ? "down" : "up";
    if (!stepId) return;
    const current = await prisma.onboardingStep.findUnique({ where: { id: stepId } });
    if (!current) return;
    const program = await getOnboardingProgram(current.moduleId);
    if (!program) return;
    const index = program.steps.findIndex((s) => s.id === stepId);
    if (index < 0) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= program.steps.length) return;
    const a = program.steps[index];
    const b = program.steps[swapWith];
    await prisma.$transaction([
      prisma.onboardingStep.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.onboardingStep.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    revalidateOnboarding(program.id);
  } catch (err) {
    console.error("moveOnboardingStep failed:", err);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  onboardingModuleSettingsSchema,
  onboardingStepSchema,
} from "@/lib/validations/onboardingChecklist";
import { getOrCreateOnboardingModule, ONBOARDING_MODULE_ID } from "@/lib/onboarding/config";

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

function revalidateOnboarding(userId?: string) {
  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/users");
  revalidatePath("/home");
  revalidatePath("/account");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

function parseStep(formData: FormData) {
  return onboardingStepSchema.safeParse({
    title: fieldString(formData, "title"),
    description: fieldString(formData, "description"),
    trackScope: fieldString(formData, "trackScope") || "ALL",
    actionType: fieldString(formData, "actionType") || "CONFIRM",
    actionTarget: fieldString(formData, "actionTarget"),
  });
}

export async function updateOnboardingSettings(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  try {
    await requireAdmin();
    await getOrCreateOnboardingModule();
    const parsed = onboardingModuleSettingsSchema.safeParse({
      enabled: formData.get("enabled") ? "on" : "false",
      dismissalDisclaimerText: fieldString(formData, "dismissalDisclaimerText"),
      requiredCourseIds: formData.getAll("requiredCourseIds").filter((v): v is string => typeof v === "string"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid settings" };
    }
    await prisma.onboardingModule.update({
      where: { id: ONBOARDING_MODULE_ID },
      data: {
        enabled: parsed.data.enabled === "on" || parsed.data.enabled === "true",
        dismissalDisclaimerText: parsed.data.dismissalDisclaimerText,
        requiredCourseIds: parsed.data.requiredCourseIds ?? [],
      },
    });
    revalidateOnboarding();
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
    const onboardingModule = await getOrCreateOnboardingModule();
    const parsed = parseStep(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid step" };
    }
    const last = onboardingModule.steps[onboardingModule.steps.length - 1];
    await prisma.onboardingStep.create({
      data: {
        moduleId: onboardingModule.id,
        order: (last?.order ?? 0) + 1,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        trackScope: parsed.data.trackScope,
        actionType: parsed.data.actionType,
        actionTarget: parsed.data.actionTarget?.trim() || null,
      },
    });
    revalidateOnboarding();
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
    await prisma.onboardingStep.update({
      where: { id: stepId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        trackScope: parsed.data.trackScope,
        actionType: parsed.data.actionType,
        actionTarget: parsed.data.actionTarget?.trim() || null,
      },
    });
    revalidateOnboarding();
  } catch (err) {
    console.error("updateOnboardingStep failed:", err);
  }
}

export async function deleteOnboardingStep(formData: FormData) {
  try {
    await requireAdmin();
    const stepId = fieldString(formData, "stepId");
    if (!stepId) return;
    await prisma.onboardingStep.delete({ where: { id: stepId } });
    revalidateOnboarding();
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
    const onboardingModule = await getOrCreateOnboardingModule();
    const index = onboardingModule.steps.findIndex((s) => s.id === stepId);
    if (index < 0) return;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= onboardingModule.steps.length) return;
    const a = onboardingModule.steps[index];
    const b = onboardingModule.steps[swapWith];
    await prisma.$transaction([
      prisma.onboardingStep.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma.onboardingStep.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    revalidateOnboarding();
  } catch (err) {
    console.error("moveOnboardingStep failed:", err);
  }
}

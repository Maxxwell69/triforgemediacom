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
import { assignOnboardingProgress } from "@/lib/onboarding/engine";

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

export async function updateOnboardingSettings(formData: FormData) {
  await requireAdmin();
  await getOrCreateOnboardingModule();
  const parsed = onboardingModuleSettingsSchema.safeParse({
    enabled: formData.get("enabled") ? "on" : "false",
    dismissalDisclaimerText: formData.get("dismissalDisclaimerText"),
    requiredCourseIds: formData.getAll("requiredCourseIds").map(String),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid settings");
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
}

export async function createOnboardingStep(formData: FormData) {
  await requireAdmin();
  const module = await getOrCreateOnboardingModule();
  const parsed = onboardingStepSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    trackScope: formData.get("trackScope") || "ALL",
    actionType: formData.get("actionType") || "CONFIRM",
    actionTarget: formData.get("actionTarget"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid step");
  }
  const last = module.steps[module.steps.length - 1];
  await prisma.onboardingStep.create({
    data: {
      moduleId: module.id,
      order: (last?.order ?? 0) + 1,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      trackScope: parsed.data.trackScope,
      actionType: parsed.data.actionType,
      actionTarget: parsed.data.actionTarget?.trim() || null,
    },
  });
  revalidateOnboarding();
}

export async function updateOnboardingStep(stepId: string, formData: FormData) {
  await requireAdmin();
  const parsed = onboardingStepSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    trackScope: formData.get("trackScope") || "ALL",
    actionType: formData.get("actionType") || "CONFIRM",
    actionTarget: formData.get("actionTarget"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid step");
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
}

export async function deleteOnboardingStep(stepId: string) {
  await requireAdmin();
  await prisma.onboardingStep.delete({ where: { id: stepId } });
  revalidateOnboarding();
}

export async function moveOnboardingStep(stepId: string, direction: "up" | "down") {
  await requireAdmin();
  const module = await getOrCreateOnboardingModule();
  const index = module.steps.findIndex((s) => s.id === stepId);
  if (index < 0) throw new Error("Step not found");
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= module.steps.length) return;
  const a = module.steps[index];
  const b = module.steps[swapWith];
  await prisma.$transaction([
    prisma.onboardingStep.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.onboardingStep.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidateOnboarding();
}

export async function assignMemberOnboarding(userId: string) {
  const admin = await requireAdmin();
  await assignOnboardingProgress(userId, admin.id);
  revalidateOnboarding(userId);
}

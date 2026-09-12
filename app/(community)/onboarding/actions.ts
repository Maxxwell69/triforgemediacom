"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { onboardingEnabled } from "@/lib/onboarding/access";
import {
  dismissOnboarding,
  reopenOnboarding,
  toggleOnboardingStep,
} from "@/lib/onboarding/engine";

function revalidateMember() {
  revalidatePath("/home");
  revalidatePath("/account");
}

export async function toggleMemberOnboardingStep(stepId: string, done: boolean) {
  const user = await requireUser();
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  await toggleOnboardingStep(user.id, stepId, done);
  revalidateMember();
}

export async function dismissMemberOnboarding(moduleId: string) {
  const user = await requireUser();
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  if (!moduleId) throw new Error("Checklist is required");
  await dismissOnboarding(user.id, moduleId);
  revalidateMember();
}

export async function reopenMemberOnboarding(formData: FormData) {
  const user = await requireUser();
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  const moduleId = String(formData.get("moduleId") || "");
  if (!moduleId) throw new Error("Checklist is required");
  await reopenOnboarding(user.id, moduleId);
  revalidateMember();
  redirect("/home");
}

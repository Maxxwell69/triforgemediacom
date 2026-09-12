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

export async function dismissMemberOnboarding() {
  const user = await requireUser();
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  await dismissOnboarding(user.id);
  revalidateMember();
}

export async function reopenMemberOnboarding() {
  const user = await requireUser();
  if (!onboardingEnabled()) throw new Error("Onboarding is not enabled");
  await reopenOnboarding(user.id);
  revalidateMember();
  redirect("/home");
}

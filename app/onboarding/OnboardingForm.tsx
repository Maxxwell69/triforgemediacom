"use client";

import ProfileForm, { type ProfileFormDefaults } from "@/components/ProfileForm";
import { completeOnboarding } from "./actions";

export default function OnboardingForm({
  defaultValues,
}: {
  defaultValues?: ProfileFormDefaults;
}) {
  return (
    <ProfileForm
      action={completeOnboarding}
      defaultValues={defaultValues}
      submitLabel="Enter the community"
      pendingLabel="Saving..."
    />
  );
}

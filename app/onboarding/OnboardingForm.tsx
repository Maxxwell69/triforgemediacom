"use client";

import ProfileForm from "@/components/ProfileForm";
import { completeOnboarding } from "./actions";

export default function OnboardingForm() {
  return (
    <ProfileForm
      action={completeOnboarding}
      submitLabel="Enter the community"
      pendingLabel="Saving..."
    />
  );
}

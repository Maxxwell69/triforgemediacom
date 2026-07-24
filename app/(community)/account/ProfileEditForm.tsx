"use client";

import ProfileForm, { type ProfileFormDefaults } from "@/components/ProfileForm";
import { updateProfile } from "./actions";

export default function ProfileEditForm({ defaultValues }: { defaultValues: ProfileFormDefaults }) {
  return (
    <ProfileForm
      action={updateProfile}
      defaultValues={defaultValues}
      submitLabel="Save changes"
      pendingLabel="Saving..."
    />
  );
}

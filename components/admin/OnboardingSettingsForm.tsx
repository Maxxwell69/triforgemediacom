"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateOnboardingSettings, type OnboardingFormState } from "@/app/admin/onboarding/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

export default function OnboardingSettingsForm({
  enabled,
  disclaimer,
  requiredCourseIds,
  courses,
}: {
  enabled: boolean;
  disclaimer: string;
  requiredCourseIds: string[];
  courses: { id: string; title: string }[];
}) {
  const [state, formAction] = useFormState<OnboardingFormState, FormData>(
    updateOnboardingSettings,
    null
  );

  return (
    <form action={formAction} className="glass mt-10 flex flex-col gap-4 rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">Settings</h2>
      <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="accent-orange" />
        Show the checklist to members (SKU must also be on)
      </label>
      <label className="font-body text-sm text-off-white/70">
        Dismiss disclaimer
        <textarea
          name="dismissalDisclaimerText"
          required
          rows={3}
          defaultValue={disclaimer}
          className={`${fieldClass} mt-1`}
        />
      </label>
      <fieldset>
        <legend className="font-body text-sm text-off-white/70">Required courses</legend>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Checklist cannot complete until these courses are finished.
        </p>
        <div className="mt-2 max-h-56 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {courses.length === 0 && (
            <p className="font-body text-xs text-off-white/40">No courses yet.</p>
          )}
          {courses.map((course) => (
            <label
              key={course.id}
              className="flex items-center gap-2 font-body text-sm text-off-white/75"
            >
              <input
                type="checkbox"
                name="requiredCourseIds"
                value={course.id}
                defaultChecked={requiredCourseIds.includes(course.id)}
                className="accent-orange"
              />
              {course.title}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-sm text-cyan">
          {state.ok}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

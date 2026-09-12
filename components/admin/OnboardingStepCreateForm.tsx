"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createOnboardingStep, type OnboardingFormState } from "@/app/admin/onboarding/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal disabled:opacity-50"
    >
      {pending ? "Adding…" : "Add step"}
    </button>
  );
}

export default function OnboardingStepCreateForm() {
  const [state, formAction] = useFormState<OnboardingFormState, FormData>(
    createOnboardingStep,
    null
  );

  return (
    <form
      key={state?.ok ? "added" : "form"}
      action={formAction}
      className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6"
    >
      <h3 className="font-display text-lg tracking-wide text-off-white/80">Add step</h3>
      <input name="title" required placeholder="Step title" className={fieldClass} />
      <textarea name="description" rows={2} placeholder="Optional details" className={fieldClass} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="font-body text-sm text-off-white/70">
          Track
          <select name="trackScope" defaultValue="ALL" className={`${fieldClass} mt-1`}>
            <option value="ALL">All members</option>
            <option value="CN">CN only</option>
            <option value="MN">MN only</option>
          </select>
        </label>
        <label className="font-body text-sm text-off-white/70">
          Action
          <select name="actionType" defaultValue="CONFIRM" className={`${fieldClass} mt-1`}>
            <option value="CONFIRM">Confirm / check off</option>
            <option value="LINK">Open a link</option>
            <option value="COURSE_LINK">Open a course</option>
            <option value="CUSTOM">Custom path</option>
          </select>
        </label>
      </div>
      <label className="font-body text-sm text-off-white/70">
        Target (needed for a link or course — leave blank to just check off)
        <input
          name="actionTarget"
          placeholder="/account/profile, https://…, or a course id"
          className={`${fieldClass} mt-1`}
        />
      </label>
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

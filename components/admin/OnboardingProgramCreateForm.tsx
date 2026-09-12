"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createOnboardingProgram, type OnboardingFormState } from "@/app/admin/onboarding/actions";

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
      {pending ? "Creating…" : "Create checklist"}
    </button>
  );
}

export default function OnboardingProgramCreateForm() {
  const [state, formAction] = useFormState<OnboardingFormState, FormData>(
    createOnboardingProgram,
    null
  );

  return (
    <form action={formAction} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">New checklist</h2>
      <input name="title" required placeholder="Getting Started, Battle launch, …" className={fieldClass} />
      <textarea
        name="description"
        rows={2}
        placeholder="Optional — what this path is for"
        className={fieldClass}
      />
      <label className="font-body text-sm text-off-white/70">
        Type
        <select name="kind" defaultValue="CUSTOM" className={`${fieldClass} mt-1`}>
          <option value="GETTING_STARTED">Getting started (new members)</option>
          <option value="CAMPAIGN">Campaign follow-through</option>
          <option value="CUSTOM">Custom path</option>
        </select>
      </label>
      <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
        <input type="checkbox" name="assignOnFirstLogin" className="accent-orange" />
        Give this to new members on first login
      </label>
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

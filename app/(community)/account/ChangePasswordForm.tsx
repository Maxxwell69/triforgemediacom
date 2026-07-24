"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePassword } from "./actions";

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 self-start rounded-lg border border-cyan/40 px-6 py-2.5 font-body font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Updating..." : "Update password"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, null);

  return (
    <form action={formAction} className="glass flex flex-col gap-4 rounded-2xl p-8">
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
          Password updated.
        </p>
      )}

      <label htmlFor="currentPassword" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Current password</span>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      <label htmlFor="newPassword" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">New password</span>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <label htmlFor="confirmPassword" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Confirm new password
        </span>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <SubmitButton />
    </form>
  );
}

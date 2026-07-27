"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changeEmail } from "./actions";
import SignOutButton from "@/components/SignOutButton";

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
      {pending ? "Updating..." : "Update email"}
    </button>
  );
}

export default function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction] = useFormState(changeEmail, null);

  if (state?.success) {
    return (
      <div className="glass flex flex-col gap-3 rounded-2xl p-8">
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
          Email updated. Sign out and back in with your new email to refresh your session.
        </p>
        <SignOutButton className="self-start rounded-lg border border-off-white/15 px-6 py-2.5 font-body font-semibold text-off-white/80 transition hover:border-cyan/40 hover:text-cyan" />
      </div>
    );
  }

  return (
    <form action={formAction} className="glass flex flex-col gap-4 rounded-2xl p-8">
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Current email</span>
        <p className="rounded-lg border border-off-white/10 bg-off-white/5 px-4 py-2.5 font-body text-off-white/60">
          {currentEmail}
        </p>
      </div>

      <label htmlFor="newEmail" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">New email</span>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </label>

      <label htmlFor="currentPasswordForEmail" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Confirm with current password
        </span>
        <input
          id="currentPasswordForEmail"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>

      <SubmitButton />
    </form>
  );
}

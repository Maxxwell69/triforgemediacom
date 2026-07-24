"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeSignup } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Setting up..." : "Set password & continue"}
    </button>
  );
}

export default function SignupForm({ token, email }: { token: string; email: string }) {
  const [state, formAction] = useFormState(completeSignup, null);

  return (
    <form action={formAction} className="glass flex flex-col gap-5 rounded-2xl p-8">
      <input type="hidden" name="token" value={token} />

      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Email</span>
        <p className="rounded-lg border border-off-white/10 bg-off-white/5 px-4 py-2.5 font-body text-off-white/60">
          {email}
        </p>
      </div>

      <label htmlFor="password" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Password</span>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </label>

      <label htmlFor="confirmPassword" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">
          Confirm password
        </span>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
          placeholder="Re-enter your password"
        />
      </label>

      <SubmitButton />
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

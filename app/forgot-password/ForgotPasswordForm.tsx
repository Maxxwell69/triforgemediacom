"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <div className="glass flex flex-col gap-4 rounded-2xl p-8 text-center">
        <p className="font-body text-off-white/80">
          If that email is registered, we&apos;ve sent a password reset link. Check your inbox.
        </p>
        <Link href="/login" className="text-cyan hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="glass flex flex-col gap-5 rounded-2xl p-8">
      {state?.error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
          {state.error}
        </p>
      )}

      <label htmlFor="email" className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Email</span>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60"
          placeholder="you@example.com"
        />
      </label>

      <SubmitButton />
    </form>
  );
}

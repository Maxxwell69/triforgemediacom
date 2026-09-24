"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completePublicClientHubSignup } from "@/app/hub-host/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating account..." : "Create fan account"}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function ClientHubFanSignupForm({ hubName }: { hubName: string }) {
  const [state, formAction] = useFormState(completePublicClientHubSignup, null);

  return (
    <form action={formAction} className="glass flex w-full max-w-sm flex-col gap-5 rounded-2xl p-8">
      {state?.error ? (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {state.href ? (
            <>
              That email already has a login.{" "}
              <a
                href={state.href}
                className="font-semibold underline decoration-orange/70 underline-offset-2 hover:text-off-white"
              >
                {state.hrefLabel ?? "Sign in"}
              </a>{" "}
              — if you’re on the network, your profile comes with you as a fan.
            </>
          ) : (
            state.error
          )}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Name</span>
        <input name="name" required minLength={2} className={inputClass} placeholder="Your name" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium text-off-white/80">Confirm password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          placeholder="Re-enter your password"
        />
      </label>
      <SubmitButton />
      <p className="font-body text-xs text-off-white/40">
        New accounts join {hubName} as a Fan. If this email is already on TriForge, sign in with that
        account instead.
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";

export default function SignInError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">TriForge Hub</p>
      <h1 className="mb-3 font-display text-4xl tracking-wide text-off-white">SIGN IN</h1>
      <p className="mb-8 max-w-md font-body text-sm text-off-white/60">
        The sign-in page hit a snag. Reload and try again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-orange px-6 py-3 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Try again
        </button>
        <Link
          href="/signin"
          className="rounded-lg border border-off-white/15 px-6 py-3 font-body text-sm font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
        >
          Reload sign in
        </Link>
      </div>
    </div>
  );
}

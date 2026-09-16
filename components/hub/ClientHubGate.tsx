"use client";

import { useState, type FormEvent, type ReactNode } from "react";

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

export default function ClientHubSignInForm({
  hubName,
  enabled,
  welcome,
  defaultEmail,
}: {
  hubName: string;
  enabled: boolean;
  welcome?: boolean;
  defaultEmail?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enabled) {
      setMessage(
        `${hubName} isn't open for sign-in yet. Your admin will send an invite when this hub is ready.`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const { signIn } = await import("next-auth/react");
    const res = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });
    setSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    const raw = new URLSearchParams(window.location.search).get("callbackUrl") || "/home";
    const next =
      raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://") ? raw : "/home";
    window.location.assign(next);
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="glass flex flex-col gap-5 rounded-2xl p-8">
        {welcome && !error ? (
          <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
            Account created — sign in to continue.
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
            {error}
          </p>
        ) : null}
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail}
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
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center font-body text-sm text-off-white/40">
        This is not the TriForge Hub. Access is invite-only for {hubName}.
      </p>
    </div>
  );
}

export function ClientHubShell({
  name,
  children,
  signInHref,
}: {
  name: string;
  children: ReactNode;
  signInHref?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-charcoal">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -8%, rgba(0,212,255,0.14), transparent 55%), radial-gradient(circle at 12% 88%, rgba(14,26,61,0.85), transparent 42%)",
        }}
      />
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="font-display text-2xl tracking-wide text-off-white">{name}</p>
        {signInHref ? (
          <a
            href={signInHref}
            className="rounded-lg border border-off-white/15 px-3 py-2 font-body text-sm font-semibold text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Sign in
          </a>
        ) : null}
      </header>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        {children}
      </main>
      <footer className="relative z-10 px-6 py-6 text-center font-body text-[11px] text-off-white/30">
        Private community hub
      </footer>
    </div>
  );
}

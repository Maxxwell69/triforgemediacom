"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

function readQuery() {
  if (typeof window === "undefined") {
    return { callbackUrl: "/home", welcome: false, reset: false };
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl") || "/home";
  const callbackUrl =
    raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://") ? raw : "/home";
  return {
    callbackUrl,
    welcome: params.get("welcome") === "1",
    reset: params.get("reset") === "1",
  };
}

export default function SignInForm() {
  const router = useRouter();
  const query = useMemo(readQuery, []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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

    router.push(query.callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="glass flex flex-col gap-5 rounded-2xl p-8">
        {query.welcome && !error && (
          <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
            Account created — sign in to continue.
          </p>
        )}
        {query.reset && !error && (
          <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
            Password updated — sign in with your new password.
          </p>
        )}
        {error && (
          <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
            {error}
          </p>
        )}

        <label htmlFor="email" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">Email</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>

        <label htmlFor="password" className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-medium text-off-white/80">Password</span>
          <input
            id="password"
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
          {submitting ? "Signing in..." : "Sign in to the Hub"}
        </button>

        <Link
          href="/forgot-password"
          className="-mt-2 text-center font-body text-sm text-off-white/50 hover:text-cyan"
        >
          Forgot your password?
        </Link>
      </form>

      <p className="mt-6 text-center font-body text-sm text-off-white/50">
        No invite yet?{" "}
        <Link href="/apply" className="text-cyan hover:underline">
          Apply for access
        </Link>
      </p>
    </div>
  );
}

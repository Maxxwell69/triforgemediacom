"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

export default function SignInForm({
  callbackUrl = "/home",
  welcome = false,
  reset = false,
}: {
  callbackUrl?: string;
  welcome?: boolean;
  reset?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

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

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="glass flex flex-col gap-5 rounded-2xl p-8">
        {welcome && !error && (
          <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-body text-cyan">
            Account created — sign in to continue.
          </p>
        )}
        {reset && !error && (
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

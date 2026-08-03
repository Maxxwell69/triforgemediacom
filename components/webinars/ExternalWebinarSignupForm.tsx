"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ExternalWebinarSignupForm({
  inviteToken,
}: {
  inviteToken: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`/api/webinars/external/${inviteToken}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Could not register. Try again.");
        return;
      }
      router.push(result.accessPath as string);
    } catch {
      setError("Could not register. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6 sm:p-8">
      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Full name
        <input
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2.5 text-off-white outline-none focus:border-orange"
          placeholder="Your name"
        />
      </label>
      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Email
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2.5 text-off-white outline-none focus:border-orange"
          placeholder="you@example.com"
        />
      </label>

      {error && <p className="font-body text-sm text-orange">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-orange px-4 py-2.5 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? "Registering…" : "Register for this webinar"}
      </button>
      <p className="font-body text-xs text-off-white/35">
        This registers you for this session only — it does not create a TriForge Community account.
      </p>
    </form>
  );
}

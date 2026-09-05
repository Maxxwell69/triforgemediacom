"use client";

import { useFormStatus } from "react-dom";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit suggestion"}
    </button>
  );
}

export default function SuggestionForm({
  action,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: string | null;
}) {
  return (
    <form action={action} className="glass flex flex-col gap-3 rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">New suggestion</h2>
      <p className="font-body text-xs text-off-white/45">
        Ideas for the hub. Admins tag them Accepted, Working on it, Applied, or Rejected.
      </p>
      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {error}
        </p>
      )}
      <input
        name="title"
        required
        minLength={5}
        maxLength={140}
        placeholder="Short title"
        className={fieldClass}
      />
      <textarea
        name="description"
        required
        minLength={10}
        maxLength={5000}
        rows={4}
        placeholder="What should we add or change, and why?"
        className={fieldClass}
      />
      <SubmitButton />
    </form>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_TICKET_CATEGORIES } from "@/lib/support";

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
      {pending ? "Opening…" : "Open ticket"}
    </button>
  );
}

export default function TicketForm({
  action,
  error,
  showHubBugLink = true,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: string | null;
  showHubBugLink?: boolean;
}) {
  return (
    <form action={action} className="glass flex flex-col gap-3 rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">New ticket</h2>
      <p className="font-body text-xs text-off-white/45">
        We&apos;ll email you when there&apos;s an update — reply in the Hub, not by email.
      </p>
      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-3 py-2 font-body text-sm text-orange">
          {error}
        </p>
      )}
      <input
        name="subject"
        required
        minLength={5}
        maxLength={140}
        placeholder="What do you need help with?"
        className={fieldClass}
      />
      <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
        Category
        <select name="category" required defaultValue="OTHER" className={fieldClass}>
          {SUPPORT_TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SUPPORT_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
      <textarea
        name="body"
        required
        minLength={10}
        maxLength={5000}
        rows={5}
        placeholder="Details — what happened, what you expected, and anything we should know."
        className={fieldClass}
      />
      {showHubBugLink && (
        <p className="font-body text-xs text-off-white/40">
          Site bugs belong on{" "}
          <a href="/bugs" className="text-cyan hover:underline">
            Hub Bug
          </a>
          .
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

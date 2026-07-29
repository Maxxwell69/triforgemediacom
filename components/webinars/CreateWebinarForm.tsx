"use client";

import { useState, useTransition } from "react";
import { createWebinarAction } from "@/app/admin/webinars/actions";

export default function CreateWebinarForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        setError(null);
        startTransition(async () => {
          const result = await createWebinarAction(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          form.reset();
        });
      }}
    >
      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Title
        <input
          name="title"
          required
          maxLength={120}
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          placeholder="Creator Kickoff Live"
        />
      </label>

      <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          placeholder="What members can expect…"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
          Scheduled for
          <input
            name="scheduledAt"
            type="datetime-local"
            required
            className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          />
        </label>
        <label className="flex flex-col gap-1 font-body text-sm text-off-white/70">
          Visibility
          <select
            name="status"
            defaultValue="SCHEDULED"
            className="rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 text-off-white outline-none focus:border-orange"
          >
            <option value="SCHEDULED">Scheduled (visible to members)</option>
            <option value="DRAFT">Draft (admins only)</option>
          </select>
        </label>
      </div>

      {error && <p className="font-body text-sm text-orange">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create webinar"}
      </button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { applyToGroup } from "@/app/(community)/groups/actions";

export default function ApplyToGroupForm({ groupId }: { groupId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="font-body text-sm text-cyan">Application submitted — hang tight for review.</p>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      action={(formData) => {
        startTransition(async () => {
          const result = await applyToGroup(groupId, formData);
          if (result.error) setError(result.error);
          else {
            setError(null);
            setDone(true);
          }
        });
      }}
    >
      <label className="font-body text-sm text-off-white/70">
        Why do you want to join? (optional)
        <textarea
          name="message"
          rows={3}
          className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60"
        />
      </label>
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Submitting…" : "Apply to join"}
      </button>
    </form>
  );
}

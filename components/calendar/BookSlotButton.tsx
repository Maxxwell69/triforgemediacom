"use client";

import { useState, useTransition } from "react";
import { bookAvailabilitySlot } from "@/app/(community)/calendar/actions";

export default function BookSlotButton({ slotId }: { slotId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return <p className="font-body text-xs text-cyan">Request sent</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10"
      >
        Book
      </button>
    );
  }

  return (
    <form
      className="flex min-w-[12rem] flex-col gap-2"
      action={(formData) => {
        startTransition(async () => {
          const result = await bookAvailabilitySlot(slotId, formData);
          if (result.error) setError(result.error);
          else {
            setError(null);
            setDone(true);
          }
        });
      }}
    >
      <input
        name="notes"
        placeholder="Note (optional)"
        className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none"
      />
      {error && <p className="font-body text-xs text-orange">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-orange px-3 py-1 font-body text-xs font-semibold text-off-white disabled:opacity-40"
        >
          {isPending ? "…" : "Request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-xs text-off-white/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

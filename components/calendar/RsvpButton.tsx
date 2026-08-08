"use client";

import { useState, useTransition } from "react";
import { rsvpCalendarEvent } from "@/app/(community)/calendar/actions";

export default function RsvpButton({ eventId }: { eventId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return <span className="font-body text-xs text-cyan">You&apos;re in</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const fd = new FormData();
            const result = await rsvpCalendarEvent(eventId, fd);
            if (result.error) setError(result.error);
            else {
              setError(null);
              setDone(true);
            }
          })
        }
        className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
      >
        {isPending ? "…" : "RSVP"}
      </button>
      {error && <p className="font-body text-xs text-orange">{error}</p>}
    </div>
  );
}

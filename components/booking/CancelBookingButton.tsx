"use client";

import { useState, useTransition } from "react";
import { cancelAppointmentByToken } from "@/app/book/cancel/actions";

export default function CancelBookingButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="mt-6 font-body text-sm text-cyan">
        Meeting cancelled. Confirmation emails are on the way.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this meeting for both people?")) return;
          startTransition(async () => {
            const result = await cancelAppointmentByToken(token);
            if (result.error) setError(result.error);
            else setDone(true);
          });
        }}
        className="rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
      >
        {pending ? "Cancelling…" : "Cancel meeting"}
      </button>
      {error && <p className="mt-3 font-body text-sm text-orange">{error}</p>}
    </div>
  );
}

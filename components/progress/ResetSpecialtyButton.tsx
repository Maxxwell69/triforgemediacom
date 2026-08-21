"use client";

import { useState, useTransition } from "react";
import { resetMySpecialty } from "@/app/(community)/progress/actions";

export default function ResetSpecialtyButton({
  currentTrack,
}: {
  currentTrack: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            `Reset ${currentTrack}? You can choose specialties again — including more than one.`
          );
          if (!ok) return;
          setError(null);
          start(async () => {
            try {
              await resetMySpecialty();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not reset specialty");
            }
          });
        }}
        className="rounded-lg border border-orange/50 px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-wide text-orange transition hover:bg-orange/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Resetting…" : "Reset specializations"}
      </button>
      {error ? <p className="mt-1 font-body text-xs text-orange">{error}</p> : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { completeMyMission } from "@/app/(community)/progress/actions";

export default function CompleteMissionButton({
  missionId,
  disabled,
  label,
}: {
  missionId: string;
  disabled?: boolean;
  label: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setError(null);
          start(async () => {
            try {
              await completeMyMission(missionId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not complete");
            }
          });
        }}
        className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Saving…" : label}
      </button>
      {error ? <p className="mt-1 font-body text-xs text-orange">{error}</p> : null}
    </div>
  );
}

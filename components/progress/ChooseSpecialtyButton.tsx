"use client";

import { useState, useTransition } from "react";
import { chooseMySpecialty } from "@/app/(community)/progress/actions";

export default function ChooseSpecialtyButton({
  missionId,
  disabled,
}: {
  missionId: string;
  disabled?: boolean;
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
              await chooseMySpecialty(missionId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not choose specialty");
            }
          });
        }}
        className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Saving…" : "Choose"}
      </button>
      {error ? <p className="mt-1 font-body text-xs text-orange">{error}</p> : null}
    </div>
  );
}

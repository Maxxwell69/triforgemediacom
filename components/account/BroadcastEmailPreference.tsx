"use client";

import { useState, useTransition } from "react";
import { setBroadcastEmailsOptInAction } from "@/app/(community)/account/actions";

export default function BroadcastEmailPreference({
  initialOptIn,
}: {
  initialOptIn: boolean;
}) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !optIn;
    setError(null);
    startTransition(async () => {
      const result = await setBroadcastEmailsOptInAction(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOptIn(next);
    });
  }

  return (
    <div className="glass mt-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg tracking-wide text-off-white/90">
            Announcement emails
          </h3>
          <p className="mt-1 font-body text-sm text-off-white/55">
            Community broadcasts (meetings, updates, company news). Account emails like invites and
            password resets always send.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={optIn}
          disabled={pending}
          onClick={toggle}
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
            optIn ? "bg-cyan/80" : "bg-off-white/20"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-off-white transition ${
              optIn ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      <p className="mt-3 font-body text-xs text-off-white/45">
        Status: {optIn ? "Subscribed" : "Unsubscribed"}
        {pending ? "…" : ""}
      </p>
      {error && <p className="mt-2 font-body text-xs text-orange">{error}</p>}
    </div>
  );
}

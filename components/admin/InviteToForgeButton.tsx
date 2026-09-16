"use client";

import { useState, useTransition } from "react";
import { inviteUserToForgeHub } from "@/app/admin/users/actions";

export default function InviteToForgeButton({ userId }: { userId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending || done}
        onClick={() => {
          start(async () => {
            const result = await inviteUserToForgeHub(userId);
            if (result?.error) setError(result.error);
            else {
              setError(null);
              setDone(true);
            }
          });
        }}
        className="rounded-lg border border-orange/40 bg-orange/15 px-3 py-1.5 font-body text-xs font-semibold text-orange hover:border-orange/70 disabled:opacity-50"
      >
        {pending ? "Inviting…" : done ? "Forge invite sent" : "Invite to Forge Hub"}
      </button>
      {error ? <span className="font-body text-[11px] text-orange">{error}</span> : null}
    </span>
  );
}

"use client";

import { useState, useTransition } from "react";
import { sendPendingGhlInvites } from "@/app/admin/import/actions";

export default function SendPendingInvitesButton({ pendingCount }: { pendingCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null);

  if (pendingCount === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            !confirm(
              `Send the Hub migration invite email to all ${pendingCount} imported contact${
                pendingCount === 1 ? "" : "s"
              } who haven't been emailed yet?`
            )
          ) {
            return;
          }
          startTransition(async () => {
            const r = await sendPendingGhlInvites();
            setResult(r);
          });
        }}
        className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sending..." : `Send pending invites (${pendingCount})`}
      </button>
      {result && (
        <p className="font-body text-xs text-off-white/50">
          Sent {result.sent}.
          {result.errors.length > 0 && ` ${result.errors.length} failed — check server logs.`}
        </p>
      )}
    </div>
  );
}

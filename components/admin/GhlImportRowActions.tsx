"use client";

import { useState, useTransition } from "react";
import { resendGhlInvite, markGhlImportStatus } from "@/app/admin/import/actions";

export default function GhlImportRowActions({
  ghlImportId,
  status,
  notEmailedYet,
}: {
  ghlImportId: string;
  status: "PENDING" | "INVITED" | "CONFIRMED" | "DECLINED";
  notEmailedYet?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function run(action: () => Promise<void>, successMsg: string) {
    setFeedback(null);
    startTransition(async () => {
      try {
        await action();
        setFeedback(successMsg);
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (status === "CONFIRMED" || status === "DECLINED") {
    return <span className="font-body text-xs text-off-white/30">{feedback}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(() => resendGhlInvite(ghlImportId), notEmailedYet ? "Invite sent" : "Invite resent")
        }
        className="rounded-lg border border-cyan/40 px-2.5 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-60"
      >
        {notEmailedYet ? "Send invite" : "Resend invite"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(() => markGhlImportStatus(ghlImportId, "CONFIRMED"), "Marked confirmed")
        }
        className="rounded-lg border border-off-white/20 px-2.5 py-1 font-body text-xs font-semibold text-off-white/70 transition hover:border-off-white/40 disabled:opacity-60"
      >
        Mark confirmed
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          run(() => markGhlImportStatus(ghlImportId, "DECLINED"), "Marked declined")
        }
        className="rounded-lg border border-orange/40 px-2.5 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-60"
      >
        Mark declined
      </button>
      {feedback && <span className="font-body text-xs text-off-white/40">{feedback}</span>}
    </div>
  );
}

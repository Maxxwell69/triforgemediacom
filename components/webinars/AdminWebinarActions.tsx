"use client";

import { useTransition } from "react";
import {
  deleteWebinarAction,
  endWebinarAction,
  startWebinarAction,
} from "@/app/admin/webinars/actions";

type Status = "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED";

export default function AdminWebinarActions({
  webinarId,
  status,
}: {
  webinarId: string;
  status: Status;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "DRAFT" || status === "SCHEDULED") && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await startWebinarAction(webinarId);
            })
          }
          className="rounded-lg border border-orange/40 px-3 py-1.5 font-body text-sm text-orange transition hover:bg-orange/10 disabled:opacity-60"
        >
          Go live
        </button>
      )}
      {status === "LIVE" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await endWebinarAction(webinarId);
            })
          }
          className="rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:bg-off-white/5 disabled:opacity-60"
        >
          End
        </button>
      )}
      {status !== "LIVE" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this webinar?")) return;
            startTransition(async () => {
              await deleteWebinarAction(webinarId);
            });
          }}
          className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/40 transition hover:border-orange/40 hover:text-orange disabled:opacity-60"
        >
          Delete
        </button>
      )}
    </div>
  );
}

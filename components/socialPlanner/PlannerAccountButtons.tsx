"use client";

import { useTransition } from "react";
import {
  disconnectPlannerAccountAction,
  refreshPlannerAccountAction,
} from "@/app/admin/social-planner/actions";

export default function PlannerAccountButtons({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => refreshPlannerAccountAction(accountId))}
        className="rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-xs text-off-white/70 disabled:opacity-50"
      >
        Refresh info
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (confirm("Disconnect this TikTok account and delete its planned posts?")) {
              await disconnectPlannerAccountAction(accountId);
            }
          })
        }
        className="rounded-lg border border-red-400/30 px-3 py-1.5 font-body text-xs text-red-300 disabled:opacity-50"
      >
        Disconnect
      </button>
    </div>
  );
}

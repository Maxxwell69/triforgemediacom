"use client";

import { useTransition } from "react";
import { cancelPlannerItemAction, retryPlannerItemAction } from "@/app/admin/social-planner/actions";

export default function PlannerItemButtons({
  itemId,
  canCancel,
  canRetry,
}: {
  itemId: string;
  canCancel: boolean;
  canRetry: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!canCancel && !canRetry) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canRetry && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => retryPlannerItemAction(itemId))}
          className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white disabled:opacity-50"
        >
          Retry publish
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => cancelPlannerItemAction(itemId))}
          className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/70 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

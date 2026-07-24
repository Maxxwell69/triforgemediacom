"use client";

import { useTransition } from "react";
import { fulfillRedemption, cancelRedemption } from "@/app/admin/rewards/actions";

export default function RedemptionActions({ redemptionId }: { redemptionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => fulfillRedemption(redemptionId))}
        className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
      >
        Fulfill
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Cancel this redemption and refund the points?")) return;
          startTransition(async () => cancelRedemption(redemptionId));
        }}
        className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
      >
        Cancel & refund
      </button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { setRewardActive } from "@/app/admin/rewards/actions";

export default function RewardActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setRewardActive(id, !isActive);
        })
      }
      className={`rounded-lg border px-3 py-1 font-body text-xs font-semibold transition disabled:opacity-40 ${
        isActive
          ? "border-orange/40 text-orange hover:bg-orange/10"
          : "border-cyan/40 text-cyan hover:bg-cyan/10"
      }`}
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

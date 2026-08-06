"use client";

import { useTransition } from "react";
import { setUserEffect } from "@/app/admin/users/actions";

export default function EffectCheckbox({
  userId,
  effect,
}: {
  userId: string;
  effect: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 font-body text-xs transition ${
        effect
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
          : "border-off-white/15 text-off-white/70 hover:border-off-white/30"
      } ${isPending ? "opacity-60" : ""}`}
      title="When on, this member’s CN badge text shows green"
    >
      <input
        type="checkbox"
        checked={effect}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            await setUserEffect(userId, next);
          });
        }}
        className="accent-emerald-400"
      />
      Effect
    </label>
  );
}

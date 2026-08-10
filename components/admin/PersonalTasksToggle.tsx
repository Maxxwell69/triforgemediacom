"use client";

import { useTransition } from "react";
import { setPersonalTasksEnabled } from "@/app/admin/users/actions";

export default function PersonalTasksToggle({
  userId,
  enabled,
}: {
  userId: string;
  enabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 font-body text-xs transition ${
        enabled
          ? "border-cyan/40 bg-cyan/10 text-cyan"
          : "border-off-white/15 text-off-white/70 hover:border-off-white/30"
      } ${isPending ? "opacity-60" : ""}`}
      title="When on, this member gets a private My Tasks list (self-assigned only)"
    >
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            await setPersonalTasksEnabled(userId, next);
          });
        }}
        className="accent-cyan"
      />
      Personal Tasks
    </label>
  );
}

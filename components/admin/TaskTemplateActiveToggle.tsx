"use client";

import { useTransition } from "react";
import { setTaskTemplateActive } from "@/app/admin/tasks/actions";

export default function TaskTemplateActiveToggle({
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
          await setTaskTemplateActive(id, !isActive);
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

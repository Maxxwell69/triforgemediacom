"use client";

import { useState, useTransition } from "react";
import { deleteProgressionItem, reorderProgressionItem } from "@/app/admin/progression/actions";

export default function ProgressionRowTools({
  id,
  kind,
  canReorder = true,
}: {
  id: string;
  kind: "category" | "level" | "mission" | "module" | "certification" | "certTier" | "skill" | "badge";
  canReorder?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (formData: FormData) => Promise<void>, extra?: Record<string, string>) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("kind", kind);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) formData.set(key, value);
    }
    setError(null);
    start(async () => {
      try {
        await action(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {canReorder ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(reorderProgressionItem, { direction: "up" })}
              className="rounded-lg border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/55 hover:text-cyan disabled:opacity-40"
            >
              Up
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(reorderProgressionItem, { direction: "down" })}
              className="rounded-lg border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/55 hover:text-cyan disabled:opacity-40"
            >
              Down
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Delete this item? This cannot be undone.")) return;
            run(deleteProgressionItem);
          }}
          className="rounded-lg border border-orange/40 px-2 py-1 font-body text-xs text-orange disabled:opacity-40"
        >
          {pending ? "Working…" : "Delete"}
        </button>
      </div>
      {error ? <p className="font-body text-xs text-orange">{error}</p> : null}
    </div>
  );
}

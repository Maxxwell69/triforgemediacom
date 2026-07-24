"use client";

import { useState, useTransition } from "react";
import { deleteBadge, upsertCourseBadge } from "@/app/admin/courses/actions";

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
} | null;

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function BadgeManager({ courseId, badge }: { courseId: string; badge: Badge }) {
  const [editing, setEditing] = useState(!badge);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await upsertCourseBadge(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-2xl p-6"
      >
        <input type="hidden" name="courseId" value={courseId} />
        {badge && <input type="hidden" name="badgeId" value={badge.id} />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr]">
          <input
            name="icon"
            defaultValue={badge?.icon ?? "🏆"}
            placeholder="🏆"
            className={fieldClass}
          />
          <input
            name="name"
            defaultValue={badge?.name ?? ""}
            required
            placeholder="Badge name"
            className={fieldClass}
          />
        </div>
        <textarea
          name="description"
          defaultValue={badge?.description ?? ""}
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Save badge
          </button>
          {badge && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-body text-sm text-off-white/50 hover:text-off-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="glass flex items-center justify-between gap-4 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{badge!.icon || "🏆"}</span>
        <div>
          <p className="font-body text-sm font-medium text-off-white">{badge!.name}</p>
          {badge!.description && (
            <p className="mt-0.5 font-body text-xs text-off-white/50">{badge!.description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Remove this badge? It will no longer be auto-awarded.")) return;
            startTransition(() => deleteBadge(badge!.id, courseId));
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

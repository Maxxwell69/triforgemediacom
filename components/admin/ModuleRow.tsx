"use client";

import { useState, useTransition } from "react";
import { deleteModule, moveModuleOrder, updateModule } from "@/app/admin/courses/actions";

type Module = {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function ModuleRow({
  courseId,
  module,
  isFirst,
  isLast,
}: {
  courseId: string;
  module: Module;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex flex-col gap-0.5">
            <button
              type="button"
              disabled={isPending || isFirst}
              onClick={() => startTransition(() => moveModuleOrder(module.id, courseId, "up"))}
              className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isPending || isLast}
              onClick={() => startTransition(() => moveModuleOrder(module.id, courseId, "down"))}
              className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
              aria-label="Move down"
            >
              ▼
            </button>
          </div>
          {!editing && (
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-medium text-off-white">
                {module.title}
              </p>
              <p className="mt-0.5 font-body text-xs text-off-white/40">
                {module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}
                {module.description ? ` \u00b7 ${module.description}` : ""}
              </p>
            </div>
          )}
        </div>
        {!editing && (
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
                if (
                  !confirm(
                    `Delete module "${module.title}"? Lessons in it become unsorted (not deleted).`
                  )
                )
                  return;
                startTransition(() => deleteModule(module.id, courseId));
              }}
              className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form
          action={async (formData) => {
            await updateModule(formData);
            setEditing(false);
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={module.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <input name="title" defaultValue={module.title} required className={fieldClass} />
          <textarea
            name="description"
            defaultValue={module.description ?? ""}
            rows={2}
            placeholder="Description (optional)"
            className={fieldClass}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-body text-sm text-off-white/50 hover:text-off-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

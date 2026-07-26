"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateTag, deleteTag } from "@/app/admin/tags/actions";

type Tag = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  selfAssignable: boolean;
  memberCount: number;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function TagRow({ tag }: { tag: Tag }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateTag(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-xl p-4"
      >
        <input type="hidden" name="id" value={tag.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" defaultValue={tag.name} required className={fieldClass} />
          <input
            name="color"
            defaultValue={tag.color}
            required
            className={`${fieldClass} sm:w-32`}
          />
        </div>
        <textarea
          name="description"
          defaultValue={tag.description ?? ""}
          rows={2}
          className={fieldClass}
        />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="selfAssignable"
            defaultChecked={tag.selfAssignable}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Members can add/remove this tag themselves
        </label>
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
    );
  }

  return (
    <div className="glass flex items-center justify-between gap-4 rounded-xl p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-body text-xs font-semibold"
          style={{ borderColor: `${tag.color}66`, color: tag.color }}
        >
          {tag.name}
        </span>
        <div className="min-w-0">
          {tag.description && (
            <p className="truncate font-body text-xs text-off-white/50">{tag.description}</p>
          )}
          <p className="truncate font-body text-xs text-off-white/40">
            {tag.memberCount} member{tag.memberCount === 1 ? "" : "s"}
            {" \u00b7 "}
            {tag.selfAssignable ? "Self-assignable" : "Admin-only"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/tags/${tag.id}`}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Manage
        </Link>
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
            if (!confirm(`Delete the "${tag.name}" tag? This can't be undone.`)) return;
            startTransition(async () => {
              await deleteTag(tag.id);
            });
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

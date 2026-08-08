"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateGroup, deleteGroup } from "@/app/admin/groups/actions";

type Group = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  grantsTikTaskAccess: boolean;
  isHome: boolean;
  joinMode: "INVITE_ONLY" | "APPLY" | "CLOSED";
  memberCount: number;
  channelCount: number;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function GroupRow({ group }: { group: Group }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateGroup(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-xl p-4"
      >
        <input type="hidden" name="id" value={group.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="name"
            defaultValue={group.name}
            required
            disabled={group.isHome}
            className={fieldClass}
          />
          <input
            name="color"
            defaultValue={group.color}
            required
            className={`${fieldClass} sm:w-32`}
          />
        </div>
        <textarea
          name="description"
          defaultValue={group.description ?? ""}
          rows={2}
          className={fieldClass}
        />
        {!group.isHome && (
          <label className="font-body text-sm text-off-white/70">
            Join mode
            <select name="joinMode" defaultValue={group.joinMode} className={`${fieldClass} mt-1`}>
              <option value="INVITE_ONLY">Invite only</option>
              <option value="APPLY">Members can apply</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="grantsTikTaskAccess"
            defaultChecked={group.grantsTikTaskAccess}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Members of this group can access TikTask
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
          className="h-4 w-4 shrink-0 rounded-full border border-off-white/20"
          style={{ backgroundColor: group.color }}
        />
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-medium text-off-white">
            {group.name}
            {group.isHome && <span className="ml-2 text-xs text-cyan">Home</span>}
          </p>
          <p className="truncate font-body text-xs text-off-white/40">
            {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            {" \u00b7 "}
            {group.channelCount} channel{group.channelCount === 1 ? "" : "s"}
            {" \u00b7 "}
            {group.joinMode}
            {" \u00b7 "}
            TikTask {group.grantsTikTaskAccess ? "allowed" : "blocked"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/groups/${group.id}`}
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
        {!group.isHome && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Delete "${group.name}"? This can't be undone.`)) return;
              startTransition(async () => {
                await deleteGroup(group.id);
              });
            }}
            className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

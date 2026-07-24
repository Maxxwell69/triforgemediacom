"use client";

import { useState, useTransition } from "react";
import { setGroupMemberAdded } from "@/app/admin/groups/actions";

type UserOption = { id: string; name: string | null; email: string };

export default function GroupMembersManager({
  groupId,
  members,
  nonMembers,
}: {
  groupId: string;
  members: UserOption[];
  nonMembers: UserOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [addId, setAddId] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {members.length === 0 && (
          <p className="font-body text-sm text-off-white/40">No members yet.</p>
        )}
        {members.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-body text-sm text-off-white/90">{u.name || u.email}</p>
              <p className="truncate font-body text-xs text-off-white/40">{u.email}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await setGroupMemberAdded(groupId, u.id, false);
                })
              }
              className="shrink-0 rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {nonMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            className="flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60"
          >
            <option value="">Add a member...</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!addId || isPending}
            onClick={() =>
              startTransition(async () => {
                await setGroupMemberAdded(groupId, addId, true);
                setAddId("");
              })
            }
            className="shrink-0 rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

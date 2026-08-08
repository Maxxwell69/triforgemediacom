"use client";

import { useState, useTransition } from "react";
import { setGroupMemberAdded, setGroupMemberRole } from "@/app/admin/groups/actions";

type UserOption = { id: string; name: string | null; email: string };
type MemberOption = UserOption & { role: "MANAGER" | "MOD" | "MEMBER" };

const ROLES = ["MEMBER", "MOD", "MANAGER"] as const;

export default function GroupMembersManager({
  groupId,
  members,
  nonMembers,
  isHome = false,
}: {
  groupId: string;
  members: MemberOption[];
  nonMembers: UserOption[];
  isHome?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [addId, setAddId] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      <div className="flex flex-col gap-2">
        {members.length === 0 && (
          <p className="font-body text-sm text-off-white/40">No members yet.</p>
        )}
        {members.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-body text-sm text-off-white/90">{u.name || u.email}</p>
              <p className="truncate font-body text-xs text-off-white/40">{u.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={u.role}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(async () => {
                    const result = await setGroupMemberRole(groupId, u.id, e.target.value);
                    setError(result.error);
                  })
                }
                className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {!isHome && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await setGroupMemberAdded(groupId, u.id, false);
                        setError(null);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to remove");
                      }
                    })
                  }
                  className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>
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

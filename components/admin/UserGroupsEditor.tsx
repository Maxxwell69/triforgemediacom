"use client";

import { useTransition } from "react";
import { toggleUserGroup } from "@/app/admin/users/actions";

type GroupOption = { id: string; name: string; color: string };

export default function UserGroupsEditor({
  userId,
  allGroups,
  memberGroupIds,
}: {
  userId: string;
  allGroups: GroupOption[];
  memberGroupIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  if (allGroups.length === 0) return null;

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan">
        Groups
      </summary>
      <div className="glass absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1.5 rounded-xl p-3">
        {allGroups.map((g) => (
          <label
            key={g.id}
            className="flex items-center gap-2 font-body text-xs text-off-white/80"
          >
            <input
              type="checkbox"
              defaultChecked={memberGroupIds.includes(g.id)}
              disabled={isPending}
              onChange={(e) =>
                startTransition(async () => {
                  await toggleUserGroup(userId, g.id, e.target.checked);
                })
              }
              className="h-3.5 w-3.5 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: g.color }}
            />
            <span className="truncate">{g.name}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

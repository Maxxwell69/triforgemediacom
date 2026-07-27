"use client";

import { useTransition } from "react";
import { setUserTagAdded } from "@/app/admin/tags/actions";

type TagOption = { id: string; name: string; color: string };

export default function UserTagsEditor({
  userId,
  allTags,
  memberTagIds,
}: {
  userId: string;
  allTags: TagOption[];
  memberTagIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  if (allTags.length === 0) return null;

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan">
        Tags
      </summary>
      <div className="glass absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1.5 rounded-xl p-3">
        {allTags.map((t) => (
          <label key={t.id} className="flex items-center gap-2 font-body text-xs text-off-white/80">
            <input
              type="checkbox"
              defaultChecked={memberTagIds.includes(t.id)}
              disabled={isPending}
              onChange={(e) =>
                startTransition(async () => {
                  await setUserTagAdded(t.id, userId, e.target.checked);
                })
              }
              className="h-3.5 w-3.5 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="truncate">{t.name}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

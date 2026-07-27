"use client";

import { useTransition } from "react";
import { setUserBadgeAdded } from "@/app/admin/badges/actions";

type BadgeOption = { id: string; name: string; icon: string | null };

export default function UserBadgesEditor({
  userId,
  allBadges,
  memberBadgeIds,
}: {
  userId: string;
  allBadges: BadgeOption[];
  memberBadgeIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  if (allBadges.length === 0) return null;

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan">
        Badges
      </summary>
      <div className="glass absolute right-0 z-10 mt-2 flex w-56 flex-col gap-1.5 rounded-xl p-3">
        {allBadges.map((b) => (
          <label key={b.id} className="flex items-center gap-2 font-body text-xs text-off-white/80">
            <input
              type="checkbox"
              defaultChecked={memberBadgeIds.includes(b.id)}
              disabled={isPending}
              onChange={(e) =>
                startTransition(async () => {
                  await setUserBadgeAdded(b.id, userId, e.target.checked);
                })
              }
              className="h-3.5 w-3.5 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span className="shrink-0">{b.icon || "🏆"}</span>
            <span className="truncate">{b.name}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

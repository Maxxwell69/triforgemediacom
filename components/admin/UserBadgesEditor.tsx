"use client";

import { useTransition } from "react";
import { setUserBadgeAdded } from "@/app/admin/badges/actions";
import InlineMultiSelect from "./InlineMultiSelect";

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

  return (
    <InlineMultiSelect
      label="Badges"
      disabled={isPending}
      selectedIds={memberBadgeIds}
      options={allBadges.map((b) => ({ id: b.id, label: b.name, icon: b.icon || "🏆" }))}
      onToggle={(badgeId, checked) =>
        startTransition(async () => {
          await setUserBadgeAdded(badgeId, userId, checked);
        })
      }
    />
  );
}

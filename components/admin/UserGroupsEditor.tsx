"use client";

import { useTransition } from "react";
import { toggleUserGroup } from "@/app/admin/users/actions";
import InlineMultiSelect from "./InlineMultiSelect";

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

  return (
    <InlineMultiSelect
      label="Groups"
      disabled={isPending}
      selectedIds={memberGroupIds}
      options={allGroups.map((g) => ({ id: g.id, label: g.name, color: g.color }))}
      onToggle={(groupId, checked) =>
        startTransition(async () => {
          await toggleUserGroup(userId, groupId, checked);
        })
      }
    />
  );
}

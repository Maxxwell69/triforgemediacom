"use client";

import { useTransition } from "react";
import { setUserTagAdded } from "@/app/admin/tags/actions";
import InlineMultiSelect from "./InlineMultiSelect";

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

  return (
    <InlineMultiSelect
      label="Tags"
      disabled={isPending}
      selectedIds={memberTagIds}
      options={allTags.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
      onToggle={(tagId, checked) =>
        startTransition(async () => {
          await setUserTagAdded(tagId, userId, checked);
        })
      }
    />
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <InlineMultiSelect
      label="Tags"
      disabled={isPending}
      selectedIds={memberTagIds}
      options={allTags.map((t) => ({ id: t.id, label: t.name, color: t.color }))}
      onToggle={(tagId, checked) =>
        startTransition(async () => {
          await setUserTagAdded(tagId, userId, checked);
          router.refresh();
        })
      }
    />
  );
}

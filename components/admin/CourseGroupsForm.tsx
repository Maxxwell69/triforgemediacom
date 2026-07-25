"use client";

import { useState, useTransition } from "react";
import { setCourseGroups } from "@/app/admin/courses/actions";

type Group = { id: string; name: string; color: string };

export default function CourseGroupsForm({
  courseId,
  allGroups,
  selectedGroupIds,
}: {
  courseId: string;
  allGroups: Group[];
  selectedGroupIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(selectedGroupIds);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-off-white/50">
        Leave empty to keep this course open to everyone with a profile. Attach groups to restrict
        access to members of at least one selected group.
      </p>
      {allGroups.length === 0 && (
        <p className="font-body text-sm text-off-white/40">No groups created yet.</p>
      )}
      <div className="flex flex-col gap-1">
        {allGroups.map((group) => (
          <label
            key={group.id}
            className="flex items-center gap-2 rounded-lg border border-off-white/10 px-3 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/30"
          >
            <input
              type="checkbox"
              checked={selected.includes(group.id)}
              onChange={() => toggle(group.id)}
              className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            {group.name}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setCourseGroups(courseId, selected);
            setSaved(true);
          })
        }
        className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Saving..." : saved ? "Saved" : "Save access groups"}
      </button>
    </div>
  );
}

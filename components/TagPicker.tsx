"use client";

import { useState, useTransition } from "react";
import { toggleMyTag } from "@/app/(community)/account/actions";

type TagOption = { id: string; name: string; color: string; description: string | null };

export default function TagPicker({
  tags,
  myTagIds,
}: {
  tags: TagOption[];
  myTagIds: string[];
}) {
  const [selected, setSelected] = useState(new Set(myTagIds));
  const [isPending, startTransition] = useTransition();

  function toggle(tag: TagOption) {
    const nextAdded = !selected.has(tag.id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (nextAdded) next.add(tag.id);
      else next.delete(tag.id);
      return next;
    });
    startTransition(async () => {
      try {
        await toggleMyTag(tag.id, nextAdded);
      } catch {
        // revert on failure
        setSelected((prev) => {
          const next = new Set(prev);
          if (nextAdded) next.delete(tag.id);
          else next.add(tag.id);
          return next;
        });
      }
    });
  }

  if (tags.length === 0) {
    return (
      <p className="font-body text-sm text-off-white/40">
        No tags available to add yet &mdash; check back once an admin creates some.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            disabled={isPending}
            title={tag.description ?? undefined}
            onClick={() => toggle(tag)}
            className="rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition disabled:opacity-60"
            style={
              active
                ? { borderColor: tag.color, color: "#0A0A0A", backgroundColor: tag.color }
                : { borderColor: `${tag.color}66`, color: tag.color, backgroundColor: "transparent" }
            }
          >
            {active ? "\u2713 " : "+ "}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { markLessonComplete } from "@/app/(community)/learn/actions";

export default function LessonCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(completed);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <p className="font-body text-sm font-semibold text-cyan">✓ Lesson complete</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="font-body text-xs text-orange">{error}</p>}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await markLessonComplete(lessonId);
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to mark complete");
            }
          });
        }}
        className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Saving..." : "Mark complete"}
      </button>
    </div>
  );
}

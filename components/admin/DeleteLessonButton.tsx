"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLesson } from "@/app/admin/courses/actions";

export default function DeleteLessonButton({
  lessonId,
  courseId,
  title,
  redirectTo,
  className,
}: {
  lessonId: string;
  courseId: string;
  title: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm(`Delete lesson "${title}"? This can't be undone.`)) return;
          setError(null);
          startTransition(async () => {
            const result = await deleteLesson(lessonId, courseId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            if (redirectTo) router.push(redirectTo);
          });
        }}
        className={
          className ??
          "rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        }
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="font-body text-xs text-orange">{error}</p> : null}
    </span>
  );
}

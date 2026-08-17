"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deleteCourse, moveCourseOrder, setCoursePublished } from "@/app/admin/courses/actions";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  isPublished: boolean;
  xpReward: number;
  lessonCount: number;
  enrollmentCount: number;
  accessGroups?: { id: string; name: string; color: string }[];
  progressionLabel?: string | null;
};

export default function CourseRow({
  course,
  isFirst,
  isLast,
}: {
  course: Course;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`glass flex items-center justify-between gap-4 rounded-xl p-4 ${
        !course.isPublished ? "opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={isPending || isFirst}
            onClick={() => startTransition(() => moveCourseOrder(course.id, "up"))}
            className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
            aria-label="Move up"
          >
            ▲
          </button>
          <button
            type="button"
            disabled={isPending || isLast}
            onClick={() => startTransition(() => moveCourseOrder(course.id, "down"))}
            className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
            aria-label="Move down"
          >
            ▼
          </button>
        </div>
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-medium text-off-white">{course.title}</p>
          <p className="truncate font-body text-xs text-off-white/40">
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
            {" \u00b7 "}
            {course.enrollmentCount} enrolled
            {" \u00b7 "}+{course.xpReward} XP
            {course.category ? ` \u00b7 ${course.category}` : ""}
          </p>
          <p className="mt-1 truncate font-body text-xs text-off-white/50">
            {course.accessGroups && course.accessGroups.length > 0 ? (
              <>
                Visible to:{" "}
                {course.accessGroups.map((g) => g.name).join(", ")}
              </>
            ) : (
              "Visible to: everyone"
            )}
            {course.progressionLabel ? ` · Progression: ${course.progressionLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/courses/${course.id}`}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Manage
        </Link>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => setCoursePublished(course.id, !course.isPublished))
          }
          className={`rounded-lg border px-3 py-1 font-body text-xs font-semibold transition disabled:opacity-40 ${
            course.isPublished
              ? "border-orange/40 text-orange hover:bg-orange/10"
              : "border-cyan/40 text-cyan hover:bg-cyan/10"
          }`}
        >
          {course.isPublished ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Delete "${course.title}"? This can't be undone.`)) return;
            startTransition(() => deleteCourse(course.id));
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

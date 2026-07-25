"use client";

import { useState, useTransition } from "react";
import { deleteLesson, moveLessonOrder, updateLesson } from "@/app/admin/courses/actions";
import { toDatetimeLocalValue } from "@/lib/validations/course";
import QuizSection from "./QuizSection";
import type { QuestionData } from "./QuestionForm";

type ModuleOption = { id: string; title: string };

type Lesson = {
  id: string;
  title: string;
  moduleId: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  htmlEmbed: string | null;
  content: string | null;
  dripDaysAfterEnroll: number | null;
  dripUnlockAt: Date | string | null;
  quiz: { id: string; title: string; passScore: number; questions: QuestionData[] } | null;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function LessonRow({
  courseId,
  lesson,
  modules,
  isFirst,
  isLast,
}: {
  courseId: string;
  lesson: Lesson;
  modules: ModuleOption[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const unlockAt =
    lesson.dripUnlockAt instanceof Date
      ? lesson.dripUnlockAt
      : lesson.dripUnlockAt
        ? new Date(lesson.dripUnlockAt)
        : null;

  const dripBits: string[] = [];
  if (lesson.dripDaysAfterEnroll != null) {
    dripBits.push(`${lesson.dripDaysAfterEnroll}d after enroll`);
  }
  if (unlockAt) {
    dripBits.push(`unlocks ${unlockAt.toLocaleDateString([], { dateStyle: "medium" })}`);
  }

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex flex-col gap-0.5">
            <button
              type="button"
              disabled={isPending || isFirst}
              onClick={() => startTransition(() => moveLessonOrder(lesson.id, courseId, "up"))}
              className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
              aria-label="Move up"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={isPending || isLast}
              onClick={() => startTransition(() => moveLessonOrder(lesson.id, courseId, "down"))}
              className="rounded border border-off-white/15 px-1.5 text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-30"
              aria-label="Move down"
            >
              ▼
            </button>
          </div>
          {!editing && (
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-medium text-off-white">
                {lesson.title}
              </p>
              <p className="mt-0.5 font-body text-xs text-off-white/40">
                {[
                  lesson.videoUrl ? "Video" : null,
                  lesson.audioUrl ? "Audio" : null,
                  lesson.htmlEmbed ? "Embed" : null,
                  lesson.content ? "Text" : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "No content"}
                {dripBits.length > 0 ? ` · Drip: ${dripBits.join(", ")}` : ""}
              </p>
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete lesson "${lesson.title}"? This can't be undone.`)) return;
                startTransition(() => deleteLesson(lesson.id, courseId));
              }}
              className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {editing && (
        <form
          action={async (formData) => {
            await updateLesson(formData);
            setEditing(false);
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={lesson.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <input name="title" defaultValue={lesson.title} required className={fieldClass} />
          <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
            Module
            <select
              name="moduleId"
              defaultValue={lesson.moduleId ?? ""}
              className={fieldClass}
            >
              <option value="">No module / Unsorted</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <input
            name="videoUrl"
            defaultValue={lesson.videoUrl ?? ""}
            placeholder="YouTube or Vimeo URL (optional)"
            className={fieldClass}
          />
          <input
            name="audioUrl"
            defaultValue={lesson.audioUrl ?? ""}
            placeholder="Audio file URL (optional)"
            className={fieldClass}
          />
          <textarea
            name="htmlEmbed"
            defaultValue={lesson.htmlEmbed ?? ""}
            rows={3}
            placeholder="HTML iframe embed (Loom, Slides, etc. — optional)"
            className={fieldClass}
          />
          <textarea
            name="content"
            defaultValue={lesson.content ?? ""}
            rows={4}
            placeholder="Lesson text content (optional)"
            className={fieldClass}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
              Days after enrollment
              <input
                type="number"
                name="dripDaysAfterEnroll"
                min={0}
                max={3650}
                defaultValue={lesson.dripDaysAfterEnroll ?? ""}
                placeholder="Leave empty = no drip"
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
              Unlock at
              <input
                type="datetime-local"
                name="dripUnlockAt"
                defaultValue={toDatetimeLocalValue(unlockAt)}
                className={fieldClass}
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-body text-sm text-off-white/50 hover:text-off-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <QuizSection courseId={courseId} lessonId={lesson.id} quiz={lesson.quiz} />
    </div>
  );
}

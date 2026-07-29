"use client";

import { useState, useTransition } from "react";
import { deleteLesson, moveLessonOrder, updateLesson } from "@/app/admin/courses/actions";
import { toDatetimeLocalValue } from "@/lib/validations/course";
import { sanitizeLessonHtml } from "@/lib/sanitizeHtml";
import { LESSON_CONTENT_CLASSES } from "@/lib/lessonContentClasses";
import ImageUploadField from "@/components/ImageUploadField";
import AssignmentSection from "./AssignmentSection";

type ModuleOption = { id: string; title: string };

type SubmissionData = {
  id: string;
  userName: string;
  submissionUrl: string | null;
  submissionText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string | null;
  submittedAt: Date;
};

type Lesson = {
  id: string;
  title: string;
  moduleId: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  htmlEmbed: string | null;
  content: string | null;
  dripDaysAfterEnroll: number | null;
  dripUnlockAt: Date | string | null;
  assignment: { id: string; title: string; instructions: string | null; submissions: SubmissionData[] } | null;
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
  const [content, setContent] = useState(lesson.content ?? "");
  const [showPreview, setShowPreview] = useState(false);

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
              <div className="flex items-center gap-3">
                {lesson.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lesson.thumbnailUrl}
                    alt=""
                    className="h-10 w-16 shrink-0 rounded-md border border-off-white/15 object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-off-white">
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-off-white/40">
                    {[
                      lesson.thumbnailUrl ? "Thumbnail" : null,
                      lesson.videoUrl ? "Video" : null,
                      lesson.audioUrl ? "Audio" : null,
                      lesson.htmlEmbed ? "Embed" : null,
                      lesson.content ? "Text" : null,
                      lesson.assignment ? "Assignment" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No content"}
                    {dripBits.length > 0 ? ` · Drip: ${dripBits.join(", ")}` : ""}
                  </p>
                </div>
              </div>
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
          <ImageUploadField
            name="thumbnailUrl"
            folder="lesson-thumbnails"
            defaultValue={lesson.thumbnailUrl}
            label="Thumbnail"
          />
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-off-white/50">
                Lesson content &mdash; plain text or HTML (headings, bold, lists, links,
                images, tables, inline <code>style</code>). Tailwind classes won&apos;t apply
                here; use inline styles instead. Large GHL custom-code pages are fine
                (up to ~200KB).
              </span>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="shrink-0 rounded-lg border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/60 transition hover:border-cyan/40 hover:text-cyan"
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div
                className={`min-h-[6rem] overflow-hidden rounded-lg border border-off-white/15 bg-off-white ${LESSON_CONTENT_CLASSES}`}
                dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(content) || "<p class=\"text-charcoal/40\">Nothing to preview yet.</p>" }}
              />
            ) : (
              <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="e.g. <h2>Welcome</h2><p>Some <strong>bold</strong> text and a list:</p><ul><li>Step one</li></ul>"
                className={`${fieldClass} font-mono text-xs`}
              />
            )}
            {showPreview && <input type="hidden" name="content" value={content} />}
          </div>
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

      <AssignmentSection courseId={courseId} lessonId={lesson.id} assignment={lesson.assignment} />
    </div>
  );
}

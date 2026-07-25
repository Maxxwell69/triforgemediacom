"use client";

import { useState, useTransition } from "react";
import {
  createAssignment,
  deleteAssignment,
  reviewSubmission,
  updateAssignment,
} from "@/app/admin/courses/actions";

type SubmissionData = {
  id: string;
  userName: string;
  submissionUrl: string | null;
  submissionText: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string | null;
  submittedAt: Date;
};

type AssignmentData = {
  id: string;
  title: string;
  instructions: string | null;
  submissions: SubmissionData[];
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function statusColor(status: SubmissionData["status"]) {
  if (status === "APPROVED") return "border-cyan/40 bg-cyan/10 text-cyan";
  if (status === "REJECTED") return "border-orange/40 bg-orange/10 text-orange";
  return "border-off-white/20 bg-off-white/5 text-off-white/60";
}

function SubmissionRow({ submission }: { submission: SubmissionData }) {
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-off-white/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-medium text-off-white">
            {submission.userName}
          </p>
          <p className="mt-0.5 font-body text-xs text-off-white/40">
            {submission.submittedAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${statusColor(submission.status)}`}
        >
          {submission.status}
        </span>
      </div>

      {submission.submissionUrl && (
        <a
          href={submission.submissionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate font-body text-xs text-cyan hover:underline"
        >
          {submission.submissionUrl}
        </a>
      )}
      {submission.submissionText && (
        <p className="mt-2 whitespace-pre-wrap font-body text-xs text-off-white/70">
          {submission.submissionText}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          className={`${fieldClass} flex-1`}
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => reviewSubmission(submission.id, "APPROVED", feedback))
          }
          className="rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => reviewSubmission(submission.id, "REJECTED", feedback))
          }
          className="rounded-lg border border-orange/40 px-3 py-2 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function AssignmentSection({
  courseId,
  lessonId,
  assignment,
}: {
  courseId: string;
  lessonId: string;
  assignment: AssignmentData | null;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!assignment) {
    return (
      <form
        action={createAssignment}
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-off-white/15 p-3"
      >
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input
          name="title"
          required
          placeholder="Assignment title"
          className={`${fieldClass} flex-1`}
        />
        <button
          type="submit"
          className="rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
        >
          Add assignment
        </button>
      </form>
    );
  }

  const pendingCount = assignment.submissions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="mt-3 rounded-lg border border-off-white/10 p-3">
      {editing ? (
        <form
          action={async (formData) => {
            await updateAssignment(formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="id" value={assignment.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <input name="title" defaultValue={assignment.title} required className={fieldClass} />
          <textarea
            name="instructions"
            defaultValue={assignment.instructions ?? ""}
            rows={3}
            placeholder="Instructions for the member (optional)"
            className={fieldClass}
          />
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
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-medium text-off-white">📎 {assignment.title}</p>
            <p className="mt-0.5 font-body text-xs text-off-white/40">
              {assignment.submissions.length} submission
              {assignment.submissions.length === 1 ? "" : "s"}
              {pendingCount > 0 ? ` · ${pendingCount} pending review` : ""}
            </p>
          </div>
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
                if (!confirm(`Delete assignment "${assignment.title}" and all submissions?`)) return;
                startTransition(() => deleteAssignment(assignment.id, courseId));
              }}
              className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {assignment.submissions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {assignment.submissions.map((s) => (
            <SubmissionRow key={s.id} submission={s} />
          ))}
        </div>
      )}
    </div>
  );
}

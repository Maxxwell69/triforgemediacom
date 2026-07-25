"use client";

import { useState, useTransition } from "react";
import { submitAssignment } from "@/app/(community)/learn/actions";

type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

type Submission = {
  submissionUrl: string | null;
  submissionText: string | null;
  status: SubmissionStatus;
  feedback: string | null;
} | null;

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function statusBanner(status: SubmissionStatus) {
  if (status === "APPROVED") {
    return { text: "✓ Approved — lesson complete", className: "text-cyan" };
  }
  if (status === "REJECTED") {
    return { text: "Changes requested — resubmit below", className: "text-orange" };
  }
  return { text: "Submitted — awaiting review", className: "text-off-white/60" };
}

export default function AssignmentSubmissionForm({
  lessonId,
  title,
  instructions,
  submission,
}: {
  lessonId: string;
  title: string;
  instructions: string | null;
  submission: Submission;
}) {
  const [submissionUrl, setSubmissionUrl] = useState(submission?.submissionUrl ?? "");
  const [submissionText, setSubmissionText] = useState(submission?.submissionText ?? "");
  const [status, setStatus] = useState<SubmissionStatus | null>(submission?.status ?? null);
  const [feedback, setFeedback] = useState(submission?.feedback ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitAssignment(lessonId, { submissionUrl, submissionText });
        setStatus("PENDING");
        setFeedback(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit assignment");
      }
    });
  }

  const banner = status ? statusBanner(status) : null;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">📎 {title}</h2>
        {instructions && (
          <p className="mt-2 whitespace-pre-wrap font-body text-sm text-off-white/60">
            {instructions}
          </p>
        )}
      </div>

      {banner && <p className={`font-body text-sm font-semibold ${banner.className}`}>{banner.text}</p>}
      {feedback && (
        <div className="rounded-lg border border-off-white/10 bg-off-white/5 p-3">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Reviewer feedback
          </p>
          <p className="mt-1 whitespace-pre-wrap font-body text-sm text-off-white/70">{feedback}</p>
        </div>
      )}

      {status !== "APPROVED" && (
        <div className="flex flex-col gap-3">
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <input
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            placeholder="Link to your work (Google Doc, Drive, video, etc.)"
            className={fieldClass}
          />
          <textarea
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows={4}
            placeholder="Or write your response here"
            className={fieldClass}
          />
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
          >
            {isPending ? "Submitting..." : status ? "Resubmit" : "Submit assignment"}
          </button>
        </div>
      )}
    </div>
  );
}

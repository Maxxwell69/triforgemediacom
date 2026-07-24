"use client";

import { useState, useTransition } from "react";
import { deleteQuestion } from "@/app/admin/courses/actions";
import QuestionForm, { type QuestionData } from "./QuestionForm";

export default function QuestionRow({
  courseId,
  quizId,
  question,
}: {
  courseId: string;
  quizId: string;
  question: QuestionData;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <QuestionForm
        courseId={courseId}
        quizId={quizId}
        question={question}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 p-3">
      <div className="min-w-0">
        <p className="font-body text-sm text-off-white/90">{question.text}</p>
        <p className="mt-0.5 truncate font-body text-xs text-off-white/40">
          {question.type.replace("_", " ").toLowerCase()}
          {" \u00b7 "}
          {Array.isArray(question.correctAnswer)
            ? question.correctAnswer.join(", ")
            : question.correctAnswer}
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
            if (!confirm("Delete this question?")) return;
            startTransition(() => deleteQuestion(question.id, courseId));
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

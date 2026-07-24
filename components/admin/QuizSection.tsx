"use client";

import { useState, useTransition } from "react";
import { createQuiz, updateQuiz, deleteQuiz } from "@/app/admin/courses/actions";
import QuestionForm, { type QuestionData } from "./QuestionForm";
import QuestionRow from "./QuestionRow";

type QuizData = {
  id: string;
  title: string;
  passScore: number;
  questions: QuestionData[];
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function QuizSection({
  courseId,
  lessonId,
  quiz,
}: {
  courseId: string;
  lessonId: string;
  quiz: QuizData | null;
}) {
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!quiz) {
    return (
      <form
        action={createQuiz}
        className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-off-white/15 p-3"
      >
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input name="title" required placeholder="Quiz title" className={`${fieldClass} flex-1`} />
        <input
          type="number"
          name="passScore"
          defaultValue={70}
          min={0}
          max={100}
          className={`${fieldClass} w-24`}
        />
        <button
          type="submit"
          className="rounded-lg border border-cyan/40 px-3 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
        >
          Add quiz
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-off-white/10 p-3">
      {editingQuiz ? (
        <form
          action={async (formData) => {
            await updateQuiz(formData);
            setEditingQuiz(false);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="id" value={quiz.id} />
          <input type="hidden" name="courseId" value={courseId} />
          <input
            name="title"
            defaultValue={quiz.title}
            required
            className={`${fieldClass} flex-1`}
          />
          <input
            type="number"
            name="passScore"
            defaultValue={quiz.passScore}
            min={0}
            max={100}
            className={`${fieldClass} w-24`}
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan/90 px-3 py-2 font-body text-xs font-semibold text-charcoal transition hover:brightness-110"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingQuiz(false)}
            className="font-body text-xs text-off-white/50 hover:text-off-white"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-medium text-off-white">📝 {quiz.title}</p>
            <p className="mt-0.5 font-body text-xs text-off-white/40">
              Pass score: {quiz.passScore}% {" \u00b7 "} {quiz.questions.length} question
              {quiz.questions.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingQuiz(true)}
              className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete quiz "${quiz.title}" and all its questions?`)) return;
                startTransition(() => deleteQuiz(quiz.id, courseId));
              }}
              className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
            >
              Delete quiz
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {quiz.questions.map((q) => (
          <QuestionRow key={q.id} courseId={courseId} quizId={quiz.id} question={q} />
        ))}
      </div>

      {addingQuestion ? (
        <div className="mt-3">
          <QuestionForm courseId={courseId} quizId={quiz.id} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingQuestion(true)}
          className="mt-3 rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          + Add question
        </button>
      )}
    </div>
  );
}

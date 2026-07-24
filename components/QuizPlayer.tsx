"use client";

import { useState, useTransition } from "react";
import type { QuestionType } from "@prisma/client";
import { submitQuizAttempt, type QuizSubmitResult } from "@/app/(community)/learn/actions";

type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
};

type Quiz = {
  id: string;
  title: string;
  passScore: number;
  questions: Question[];
};

export default function QuizPlayer({
  lessonId,
  quiz,
  completed,
}: {
  lessonId: string;
  quiz: Quiz;
  completed: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showQuiz, setShowQuiz] = useState(!completed);

  function setSingle(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMulti(questionId: string, value: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [questionId]: next };
    });
  }

  function reset() {
    setResult(null);
    setAnswers({});
    setShowQuiz(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitQuizAttempt(lessonId, answers);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit quiz");
      }
    });
  }

  if (completed && !showQuiz) {
    return (
      <div className="glass flex flex-col gap-3 rounded-2xl p-6">
        <p className="font-body text-sm font-semibold text-cyan">
          ✓ Quiz passed &mdash; lesson complete
        </p>
        <button
          type="button"
          onClick={reset}
          className="self-start font-body text-sm text-off-white/50 hover:text-off-white"
        >
          Retake quiz
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="glass flex flex-col gap-3 rounded-2xl p-6">
        <p className={`font-display text-3xl ${result.passed ? "text-cyan" : "text-orange"}`}>
          {result.score}%
        </p>
        <p className="font-body text-sm text-off-white/70">
          {result.passed
            ? "You passed! This lesson is now complete."
            : `You need ${result.passScore}% to pass. Give it another shot.`}
        </p>
        <button
          type="button"
          onClick={reset}
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div className="glass flex flex-col gap-6 rounded-2xl p-6">
      <div>
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">{quiz.title}</h2>
        <p className="mt-1 font-body text-xs text-off-white/40">Pass score: {quiz.passScore}%</p>
      </div>

      {error && <p className="font-body text-sm text-orange">{error}</p>}

      <div className="flex flex-col gap-5">
        {quiz.questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="font-body text-sm font-medium text-off-white">
              {index + 1}. {question.text}
            </p>
            <div className="flex flex-col gap-1.5 pl-1">
              {question.options.map((opt) =>
                question.type === "MULTI_SELECT" ? (
                  <label
                    key={opt}
                    className="flex items-center gap-2 font-body text-sm text-off-white/70"
                  >
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(answers[question.id]) &&
                        (answers[question.id] as string[]).includes(opt)
                      }
                      onChange={() => toggleMulti(question.id, opt)}
                      className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
                    />
                    {opt}
                  </label>
                ) : (
                  <label
                    key={opt}
                    className="flex items-center gap-2 font-body text-sm text-off-white/70"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === opt}
                      onChange={() => setSingle(question.id, opt)}
                      className="h-4 w-4 border-off-white/30 bg-transparent accent-orange"
                    />
                    {opt}
                  </label>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Submitting..." : "Submit quiz"}
      </button>
    </div>
  );
}

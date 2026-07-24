"use client";

import { useState, useTransition } from "react";
import { createQuestion, updateQuestion } from "@/app/admin/courses/actions";
import { parseOptionsField, QUESTION_TYPES, type QuestionTypeValue } from "@/lib/validations/course";

export type QuestionData = {
  id: string;
  type: QuestionTypeValue;
  text: string;
  options: string[];
  correctAnswer: string | string[];
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

const TYPE_LABELS: Record<QuestionTypeValue, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE: "True / False",
  MULTI_SELECT: "Multi-select",
};

export default function QuestionForm({
  courseId,
  quizId,
  question,
  onCancel,
}: {
  courseId: string;
  quizId: string;
  question?: QuestionData;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<QuestionTypeValue>(question?.type ?? "MULTIPLE_CHOICE");
  const [text, setText] = useState(question?.text ?? "");
  const [optionsRaw, setOptionsRaw] = useState(
    question && question.type !== "TRUE_FALSE" ? question.options.join("\n") : ""
  );
  const [correctSingle, setCorrectSingle] = useState(
    question && !Array.isArray(question.correctAnswer) ? question.correctAnswer : ""
  );
  const [correctMulti, setCorrectMulti] = useState<string[]>(
    question && Array.isArray(question.correctAnswer) ? question.correctAnswer : []
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const options = type === "TRUE_FALSE" ? ["True", "False"] : parseOptionsField(optionsRaw);

  function toggleMulti(opt: string) {
    setCorrectMulti((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    if (question) formData.set("id", question.id);
    formData.set("quizId", quizId);
    formData.set("courseId", courseId);
    formData.set("type", type);
    formData.set("text", text);
    formData.set("optionsJson", JSON.stringify(options));
    formData.set(
      "correctAnswerJson",
      JSON.stringify(type === "MULTI_SELECT" ? correctMulti : correctSingle)
    );

    startTransition(async () => {
      try {
        if (question) {
          await updateQuestion(formData);
          onCancel?.();
        } else {
          await createQuestion(formData);
          setText("");
          setOptionsRaw("");
          setCorrectSingle("");
          setCorrectMulti([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save question");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-off-white/10 p-3">
      {error && <p className="font-body text-xs text-orange">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[170px_1fr]">
        <select
          value={type}
          onChange={(e) => {
            const next = e.target.value as QuestionTypeValue;
            setType(next);
            setCorrectSingle("");
            setCorrectMulti([]);
          }}
          className={fieldClass}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Question text"
          className={fieldClass}
        />
      </div>

      {type !== "TRUE_FALSE" && (
        <textarea
          value={optionsRaw}
          onChange={(e) => setOptionsRaw(e.target.value)}
          rows={3}
          placeholder="One option per line (or comma-separated)"
          className={fieldClass}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
          Correct answer{type === "MULTI_SELECT" ? "s" : ""}
        </p>
        {options.length === 0 && (
          <p className="font-body text-xs text-off-white/40">Add options above first.</p>
        )}
        {options.map((opt) =>
          type === "MULTI_SELECT" ? (
            <label
              key={opt}
              className="flex items-center gap-2 font-body text-sm text-off-white/80"
            >
              <input
                type="checkbox"
                checked={correctMulti.includes(opt)}
                onChange={() => toggleMulti(opt)}
                className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
              />
              {opt}
            </label>
          ) : (
            <label
              key={opt}
              className="flex items-center gap-2 font-body text-sm text-off-white/80"
            >
              <input
                type="radio"
                name={`correct-${question?.id ?? "new"}`}
                checked={correctSingle === opt}
                onChange={() => setCorrectSingle(opt)}
                className="h-4 w-4 border-off-white/30 bg-transparent accent-orange"
              />
              {opt}
            </label>
          )
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSubmit}
          className="self-start rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110 disabled:opacity-40"
        >
          {question ? "Save" : "Add question"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="font-body text-sm text-off-white/50 hover:text-off-white"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

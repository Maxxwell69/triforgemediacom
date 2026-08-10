"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPersonalTask,
  deletePersonalTask,
  setPersonalTaskStatus,
} from "@/app/apps/tasks/actions";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueAt: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

function formatDue(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PersonalTaskBoard({ tasks: initial }: { tasks: Task[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  const open = initial.filter((t) => t.status !== "DONE");
  const done = initial.filter((t) => t.status === "DONE");

  return (
    <div className="flex flex-col gap-6">
      <form
        className="glass flex flex-col gap-3 rounded-2xl p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          run(async () => {
            const result = await createPersonalTask(formData);
            if (!result.error) form.reset();
            return result;
          });
        }}
      >
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
          New task
        </p>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="What do you need to do?"
          className={fieldClass}
        />
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          placeholder="Notes (optional)"
          className={fieldClass}
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <span className="font-body text-xs text-off-white/45">Due date</span>
            <input name="dueAt" type="date" className={fieldClass} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
          >
            {pending ? "Saving…" : "Add task"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="rounded-xl border border-off-white/10 px-4 py-6 text-center font-body text-sm text-off-white/40">
            No open tasks — add one above.
          </p>
        ) : (
          open.map((task) => (
            <TaskRow key={task.id} task={task} pending={pending} onRun={run} />
          ))
        )}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
            Done ({done.length})
          </h2>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} pending={pending} onRun={run} />
          ))}
        </section>
      )}
    </div>
  );
}

function TaskRow({
  task,
  pending,
  onRun,
}: {
  task: Task;
  pending: boolean;
  onRun: (action: () => Promise<{ error: string | null }>) => void;
}) {
  const due = formatDue(task.dueAt);
  const isDone = task.status === "DONE";

  return (
    <div
      className={`glass flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-start sm:justify-between ${
        isDone ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <p
          className={`font-body text-sm font-medium text-off-white ${
            isDone ? "line-through" : ""
          }`}
        >
          {task.title}
        </p>
        {task.notes ? (
          <p className="mt-1 whitespace-pre-wrap font-body text-xs text-off-white/50">
            {task.notes}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 font-body text-[11px] uppercase tracking-wide text-off-white/35">
          <span>{task.status.replace("_", " ")}</span>
          {due ? <span>· Due {due}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {!isDone && (
          <>
            {task.status === "TODO" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onRun(() => setPersonalTaskStatus(task.id, "IN_PROGRESS"))}
                className="rounded-lg border border-cyan/30 px-3 py-1.5 font-body text-xs text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
              >
                Start
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => onRun(() => setPersonalTaskStatus(task.id, "DONE"))}
              className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/80 transition hover:bg-off-white/5 disabled:opacity-40"
            >
              Done
            </button>
          </>
        )}
        {isDone && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onRun(() => setPersonalTaskStatus(task.id, "TODO"))}
            className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:bg-off-white/5 disabled:opacity-40"
          >
            Reopen
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this task?")) return;
            onRun(() => deletePersonalTask(task.id));
          }}
          className="rounded-lg border border-orange/25 px-3 py-1.5 font-body text-xs text-orange/90 transition hover:bg-orange/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

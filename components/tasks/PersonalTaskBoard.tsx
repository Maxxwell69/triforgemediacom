"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPersonalTask,
  deletePersonalTask,
  setPersonalTaskStatus,
  updatePersonalTask,
} from "@/app/apps/tasks/actions";
import { formatDateOnly } from "@/lib/time";
import { personalTaskCategoryOptions } from "@/lib/validations/personalTask";

type Task = {
  id: string;
  title: string;
  notes: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueAt: string | null;
  category: string | null;
};

type SortMode = "added" | "due" | "category";

const SORT_STORAGE_KEY = "hub.personalTasks.sort";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

function formatDue(iso: string | null) {
  if (!iso) return null;
  return formatDateOnly(iso);
}

function compareDue(a: Task, b: Task) {
  if (!a.dueAt && !b.dueAt) return 0;
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  return a.dueAt.localeCompare(b.dueAt);
}

function compareCategory(a: Task, b: Task) {
  const ac = (a.category || "").toLowerCase();
  const bc = (b.category || "").toLowerCase();
  if (!ac && !bc) return compareDue(a, b);
  if (!ac) return 1;
  if (!bc) return -1;
  return ac.localeCompare(bc) || compareDue(a, b);
}

function sortTasks(tasks: Task[], mode: SortMode) {
  if (mode === "added") return tasks;
  const copy = [...tasks];
  copy.sort(mode === "due" ? compareDue : compareCategory);
  return copy;
}

function groupByCategory(tasks: Task[]) {
  const groups: { label: string; tasks: Task[] }[] = [];
  const index = new Map<string, number>();
  for (const task of tasks) {
    const label = task.category?.trim() || "No category";
    const existing = index.get(label);
    if (existing === undefined) {
      index.set(label, groups.length);
      groups.push({ label, tasks: [task] });
    } else {
      groups[existing].tasks.push(task);
    }
  }
  return groups;
}

export default function PersonalTaskBoard({ tasks: initial }: { tasks: Task[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sort, setSort] = useState<SortMode>("added");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_STORAGE_KEY);
      if (saved === "added" || saved === "due" || saved === "category") {
        setSort(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  function changeSort(next: SortMode) {
    setSort(next);
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function run(action: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  const usedCategories = useMemo(() => {
    const extra = initial
      .map((t) => t.category?.trim())
      .filter((c): c is string => Boolean(c) && !personalTaskCategoryOptions.includes(c as (typeof personalTaskCategoryOptions)[number]));
    return [...personalTaskCategoryOptions, ...Array.from(new Set(extra)).sort((a, b) => a.localeCompare(b))];
  }, [initial]);

  const open = sortTasks(
    initial.filter((t) => t.status !== "DONE"),
    sort
  );
  const done = sortTasks(
    initial.filter((t) => t.status === "DONE"),
    sort
  );

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
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <span className="font-body text-xs text-off-white/45">Category</span>
            <input
              name="category"
              list="personal-task-categories"
              maxLength={40}
              placeholder="Optional"
              className={fieldClass}
            />
            <datalist id="personal-task-categories">
              {usedCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
          Sort
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["added", "Added"],
              ["due", "Due date"],
              ["category", "Category"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeSort(value)}
              aria-pressed={sort === value}
              className={`rounded-lg px-3 py-1.5 font-body text-xs transition ${
                sort === value
                  ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40"
                  : "border border-off-white/15 text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <TaskSection
        title={`Open (${open.length})`}
        empty="No open tasks — add one above."
        tasks={open}
        sort={sort}
        pending={pending}
        categories={usedCategories}
        onRun={run}
      />

      {done.length > 0 && (
        <TaskSection
          title={`Done (${done.length})`}
          tasks={done}
          sort={sort}
          pending={pending}
          categories={usedCategories}
          onRun={run}
        />
      )}
    </div>
  );
}

function TaskSection({
  title,
  empty,
  tasks,
  sort,
  pending,
  categories,
  onRun,
}: {
  title: string;
  empty?: string;
  tasks: Task[];
  sort: SortMode;
  pending: boolean;
  categories: string[];
  onRun: (action: () => Promise<{ error: string | null }>) => void;
}) {
  const groups = sort === "category" ? groupByCategory(tasks) : [{ label: null, tasks }];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
        {title}
      </h2>
      {tasks.length === 0 && empty ? (
        <p className="rounded-xl border border-off-white/10 px-4 py-6 text-center font-body text-sm text-off-white/40">
          {empty}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.label ?? "flat"} className="flex flex-col gap-2">
            {group.label ? (
              <p className="mt-1 px-1 font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/30">
                {group.label}
                <span className="ml-1.5 font-normal normal-case tracking-normal text-off-white/25">
                  {group.tasks.length}
                </span>
              </p>
            ) : null}
            {group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                pending={pending}
                categories={categories}
                onRun={onRun}
              />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

function TaskRow({
  task,
  pending,
  categories,
  onRun,
}: {
  task: Task;
  pending: boolean;
  categories: string[];
  onRun: (action: () => Promise<{ error: string | null }>) => void;
}) {
  const due = formatDue(task.dueAt);
  const isDone = task.status === "DONE";
  const categoryChoices =
    task.category && !categories.includes(task.category)
      ? [...categories, task.category]
      : categories;

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
          <label className="inline-flex items-center gap-1.5 normal-case tracking-normal">
            <span className="sr-only">Category</span>
            <select
              value={task.category ?? ""}
              disabled={pending}
              onChange={(e) => {
                const formData = new FormData();
                formData.set("category", e.target.value);
                onRun(() => updatePersonalTask(task.id, formData));
              }}
              className="rounded-md border border-off-white/10 bg-off-white/5 px-1.5 py-0.5 font-body text-[11px] uppercase tracking-wide text-off-white/55 outline-none focus:border-cyan/50 disabled:opacity-40"
            >
              <option value="">No category</option>
              {categoryChoices.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
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

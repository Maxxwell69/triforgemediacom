"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  status: "PENDING" | "DONE" | "SKIPPED";
  template: {
    taskText: string;
    xpValue: number;
  };
};

export default function TaskList({ tasks: initialTasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastXp, setLastXp] = useState<number | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  async function complete(taskId: string) {
    setPendingId(taskId);
    setError(null);
    try {
      const res = await fetch(`/api/tiktask/${taskId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't complete task");
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "DONE" as const } : t))
      );
      setLastXp(data.xpAwarded);
      setTimeout(() => setLastXp(null), 2500);
      router.refresh();
    } catch {
      setError("Couldn't complete task");
    } finally {
      setPendingId(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
        No tasks matched your platform/goals yet. An admin may need to add task
        templates for you.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {error}
        </p>
      )}
      {lastXp !== null && (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          +{lastXp} XP earned!
        </p>
      )}

      {tasks.map((task) => {
        const isDone = task.status === "DONE";
        return (
          <label
            key={task.id}
            className={`glass flex items-center gap-4 rounded-xl p-4 transition ${
              isDone ? "opacity-60" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={isDone}
              disabled={isDone || pendingId === task.id}
              onChange={() => complete(task.id)}
              className="h-5 w-5 shrink-0 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span
              className={`flex-1 font-body text-sm ${
                isDone ? "text-off-white/50 line-through" : "text-off-white/90"
              }`}
            >
              {task.template.taskText}
            </span>
            <span className="shrink-0 font-body text-xs font-semibold text-cyan">
              +{task.template.xpValue} XP
            </span>
          </label>
        );
      })}
    </div>
  );
}

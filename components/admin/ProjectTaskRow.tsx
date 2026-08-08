"use client";

import { useTransition } from "react";
import { deleteProjectTask, updateProjectTask } from "@/app/admin/projects/actions";

type UserOption = { id: string; name: string | null; email: string };

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  assigneeId: string | null;
  dueAt: Date | string | null;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1.5 font-body text-xs text-off-white outline-none";

function toLocalInput(value: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProjectTaskRow({
  task,
  users,
}: {
  task: Task;
  users: UserOption[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 rounded-xl border border-off-white/10 p-3"
      action={(formData) => {
        startTransition(async () => {
          await updateProjectTask(task.id, formData);
        });
      }}
    >
      <input name="title" defaultValue={task.title} required className={fieldClass} />
      <textarea
        name="description"
        defaultValue={task.description ?? ""}
        rows={2}
        className={fieldClass}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select name="assigneeId" defaultValue={task.assigneeId ?? ""} className={fieldClass}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
        <input
          name="dueAt"
          type="datetime-local"
          defaultValue={toLocalInput(task.dueAt)}
          className={fieldClass}
        />
        <select name="status" defaultValue={task.status} className={fieldClass}>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-cyan/90 px-3 py-1 font-body text-xs font-semibold text-charcoal disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Delete this task?")) return;
            startTransition(async () => {
              await deleteProjectTask(task.id);
            });
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { createProjectTask } from "@/app/admin/projects/actions";

type UserOption = { id: string; name: string | null; email: string };

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default function ProjectTaskForm({
  projectId,
  users,
}: {
  projectId: string;
  users: UserOption[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      action={(formData) => {
        startTransition(async () => {
          await createProjectTask(projectId, formData);
        });
      }}
    >
      <input name="title" required placeholder="Task title" className={fieldClass} />
      <textarea
        name="description"
        rows={2}
        placeholder="Optional details"
        className={fieldClass}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select name="assigneeId" defaultValue="" className={fieldClass}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
        <input name="dueAt" type="datetime-local" className={fieldClass} />
        <select name="status" defaultValue="TODO" className={fieldClass}>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white disabled:opacity-40"
      >
        {isPending ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}

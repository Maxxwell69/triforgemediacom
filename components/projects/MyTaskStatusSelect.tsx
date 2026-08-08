"use client";

import { useTransition } from "react";
import { updateMyProjectTaskStatus } from "@/app/apps/projects/actions";

export default function MyTaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(async () => {
          await updateMyProjectTaskStatus(taskId, e.target.value);
        })
      }
      className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none disabled:opacity-40"
    >
      <option value="TODO">To do</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="DONE">Done</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  );
}

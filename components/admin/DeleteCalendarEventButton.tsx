"use client";

import { useTransition } from "react";
import { deleteAdminCalendarEvent } from "@/app/admin/calendar/actions";

export default function DeleteCalendarEventButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Delete this event?")) return;
        startTransition(async () => {
          await deleteAdminCalendarEvent(eventId);
        });
      }}
      className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange disabled:opacity-40"
    >
      Delete
    </button>
  );
}

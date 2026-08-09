"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupCalendarEvent } from "@/app/(community)/calendar/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

type CreatableGroup = {
  id: string;
  name: string;
  color: string;
};

export default function CreateGroupEventForm({ groups }: { groups: CreatableGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (groups.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-orange/40 bg-orange/10 px-4 py-2 font-body text-sm font-semibold text-orange transition hover:bg-orange/15"
      >
        + New group event
      </button>
    );
  }

  return (
    <form
      className="glass flex flex-col gap-3 rounded-2xl p-5"
      action={(formData) => {
        startTransition(async () => {
          const result = await createGroupCalendarEvent(formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setError(null);
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl tracking-wide text-off-white/85">New group event</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-xs text-off-white/45 hover:text-off-white"
        >
          Cancel
        </button>
      </div>
      <input name="title" required placeholder="Title" className={fieldClass} />
      <textarea
        name="description"
        rows={2}
        placeholder="Optional description"
        className={fieldClass}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select name="groupId" required defaultValue={groups[0]?.id} className={fieldClass}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select name="kind" defaultValue="EVENT" className={fieldClass}>
          <option value="EVENT">Event</option>
          <option value="MEETING">Meeting</option>
          <option value="LIVE">Live</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <input name="location" placeholder="Location / link (optional)" className={fieldClass} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="startsAt" type="datetime-local" required className={fieldClass} />
        <input name="endsAt" type="datetime-local" className={fieldClass} />
      </div>
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
      >
        {isPending ? "Scheduling…" : "Schedule event"}
      </button>
    </form>
  );
}

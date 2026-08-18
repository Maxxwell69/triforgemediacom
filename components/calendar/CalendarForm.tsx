"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCalendarWhen } from "@/lib/calendarClient";
import DeleteSlotButton from "@/components/calendar/DeleteSlotButton";
import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import { attachDeviceTimeZone } from "@/lib/timeClient";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

type Slot = {
  id: string;
  kind: string;
  label: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
};

type ActionResult = { error: string | null };

export default function CalendarForm({
  mode,
  action,
  mySlots = [],
}: {
  mode: "availability" | "event";
  action: (formData: FormData) => Promise<ActionResult>;
  mySlots?: Slot[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(formData: FormData) {
    attachDeviceTimeZone(formData, ["startsAt", "endsAt"]);
    startTransition(async () => {
      const result = await action(formData);
      setError(result.error);
      if (!result.error) router.refresh();
    });
  }

  if (mode === "availability") {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">
          Post availability
        </h2>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Live = go-live window. Free = bookable. Busy = blocked.
        </p>
        <form className="mt-4 flex flex-col gap-3" action={runAction}>
          <select name="kind" defaultValue="LIVE" className={fieldClass}>
            <option value="LIVE">Going live</option>
            <option value="FREE">Free to book</option>
            <option value="BUSY">Busy / blocked</option>
          </select>
          <input name="label" placeholder="Label (optional)" className={fieldClass} />
          <input name="startsAt" type="datetime-local" required className={fieldClass} />
          <input name="endsAt" type="datetime-local" required className={fieldClass} />
          <DeviceTimeZoneField />
          <label className="flex items-center gap-2 font-body text-xs text-off-white/60">
            <input type="checkbox" name="isBookable" defaultChecked className="accent-orange" />
            Bookable (FREE slots only)
          </label>
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
          >
            {isPending ? "Saving…" : "Save availability"}
          </button>
        </form>

        {mySlots.length > 0 && (
          <div className="mt-6 flex flex-col gap-2 border-t border-off-white/10 pt-4">
            {mySlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-body text-xs text-off-white/80">
                    {slot.kind}
                    {slot.label ? ` · ${slot.label}` : ""}
                  </p>
                  <p className="font-body text-xs text-off-white/40">
                    {formatCalendarWhen(slot.startsAt, slot.endsAt)}
                  </p>
                </div>
                <DeleteSlotButton slotId={slot.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white/80">Post an event</h2>
      <p className="mt-1 font-body text-xs text-off-white/40">
        Special events or live sessions for the hub.
      </p>
      <form className="mt-4 flex flex-col gap-3" action={runAction}>
        <input name="title" required placeholder="Event title" className={fieldClass} />
        <select name="kind" defaultValue="EVENT" className={fieldClass}>
          <option value="EVENT">Event</option>
          <option value="LIVE">Live</option>
        </select>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional details"
          className={fieldClass}
        />
        <input name="location" placeholder="Location / link (optional)" className={fieldClass} />
        <input name="startsAt" type="datetime-local" required className={fieldClass} />
        <input name="endsAt" type="datetime-local" className={fieldClass} />
        <DeviceTimeZoneField />
        {error && <p className="font-body text-sm text-orange">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal disabled:opacity-40"
        >
          {isPending ? "Posting…" : "Post to calendar"}
        </button>
      </form>
    </div>
  );
}

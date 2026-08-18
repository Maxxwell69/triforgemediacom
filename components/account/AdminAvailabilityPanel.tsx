"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
} from "@/app/(community)/calendar/actions";
import { formatCalendarWhen } from "@/lib/calendarClient";
import DeviceTimeZoneField from "@/components/DeviceTimeZoneField";
import { attachDeviceTimeZone } from "@/lib/timeClient";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

type Slot = {
  id: string;
  kind: string;
  label: string | null;
  startsAt: string;
  endsAt: string;
  isBookable: boolean;
};

export default function AdminAvailabilityPanel({ slots }: { slots: Slot[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div>
        <p className="font-body text-sm text-off-white/70">
          Post when you&apos;re free for meetings, going live, or busy. Member event scheduling
          will live here later — for now this is staff availability only.
        </p>
      </div>

      <form
        className="flex flex-col gap-3"
        action={(formData) => {
          attachDeviceTimeZone(formData, ["startsAt", "endsAt"]);
          startTransition(async () => {
            const result = await createAvailabilitySlot(formData);
            setError(result.error);
            if (!result.error) router.refresh();
          });
        }}
      >
        <select name="kind" defaultValue="FREE" className={fieldClass}>
          <option value="FREE">Free to book</option>
          <option value="LIVE">Going live</option>
          <option value="BUSY">Busy / blocked</option>
        </select>
        <input name="label" placeholder="Label (optional)" className={fieldClass} />
        <input name="startsAt" type="datetime-local" required className={fieldClass} />
        <input name="endsAt" type="datetime-local" required className={fieldClass} />
        <DeviceTimeZoneField />
        <label className="flex items-center gap-2 font-body text-xs text-off-white/60">
          <input type="checkbox" name="isBookable" defaultChecked className="accent-orange" />
          Bookable (FREE slots)
        </label>
        {error && <p className="font-body text-sm text-orange">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Add availability"}
        </button>
      </form>

      <div className="flex flex-col gap-2 border-t border-off-white/10 pt-4">
        {slots.length === 0 && (
          <p className="font-body text-sm text-off-white/40">No upcoming availability posted.</p>
        )}
        {slots.map((slot) => (
          <div key={slot.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-sm text-off-white/85">
                {slot.kind}
                {slot.label ? ` · ${slot.label}` : ""}
              </p>
              <p className="font-body text-xs text-off-white/40">
                {formatCalendarWhen(slot.startsAt, slot.endsAt)}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteAvailabilitySlot(slot.id);
                  router.refresh();
                })
              }
              className="font-body text-xs text-orange/80 hover:text-orange disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

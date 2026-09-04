"use client";

import { useMemo, useState, useTransition } from "react";
import { bookAppointment } from "@/app/book/actions";
import type { OpenSlot } from "@/lib/bookingClient";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export type PublicMeetingType = {
  id: string;
  title: string;
  description: string | null;
  durationMins: number;
  slots: OpenSlot[];
};

type Props = {
  slug: string;
  title: string;
  description: string | null;
  hostName: string;
  timezone: string;
  durationMins: number;
  slots: OpenSlot[];
  meetingTypes: PublicMeetingType[];
};

export default function PublicBookingClient({
  slug,
  title,
  description,
  hostName,
  timezone,
  durationMins,
  slots,
  meetingTypes,
}: Props) {
  const [typeId, setTypeId] = useState<string | null>(meetingTypes[0]?.id ?? null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<OpenSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneUrl, setDoneUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeType = meetingTypes.find((t) => t.id === typeId) ?? null;
  const activeSlots = activeType?.slots ?? slots;
  const activeDuration = activeType?.durationMins ?? durationMins;
  const activeTitle = activeType?.title ?? title;

  const days = useMemo(() => {
    const map = new Map<string, { label: string; slots: OpenSlot[] }>();
    for (const slot of activeSlots) {
      const d = new Date(slot.startsAt);
      const key = d.toLocaleDateString("en-CA", { timeZone: timezone });
      const label = d.toLocaleDateString([], {
        timeZone: timezone,
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const entry = map.get(key) ?? { label, slots: [] };
      entry.slots.push(slot);
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [activeSlots, timezone]);

  const daySlots = days.find((d) => d.key === dayKey)?.slots ?? [];

  if (doneUrl) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <h2 className="font-display text-3xl tracking-wide text-gradient">You&apos;re booked</h2>
        <p className="mt-3 font-body text-sm text-off-white/60">
          Confirmation emails are on the way with your meeting room link.
        </p>
        <a
          href={doneUrl}
          className="mt-6 inline-block rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow"
        >
          Open meeting room
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-body text-sm text-off-white/50">Meeting with {hostName}</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide text-gradient sm:text-5xl">
          {activeTitle}
        </h1>
        {(activeType?.description || description) && (
          <p className="mt-2 font-body text-sm text-off-white/60">
            {activeType?.description || description}
          </p>
        )}
        <p className="mt-2 font-body text-xs text-off-white/40">
          {activeDuration} minutes · times in {timezone}
        </p>
      </div>

      {meetingTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {meetingTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setTypeId(type.id);
                setDayKey(null);
                setSelected(null);
              }}
              className={[
                "rounded-xl border px-3 py-2 text-left font-body text-sm transition",
                typeId === type.id
                  ? "border-cyan/50 bg-cyan/15 text-cyan"
                  : "border-off-white/10 text-off-white/70 hover:border-off-white/25",
              ].join(" ")}
            >
              <span className="block font-medium">{type.title}</span>
              <span className="block text-[11px] text-off-white/45">{type.durationMins} min</span>
            </button>
          ))}
        </div>
      )}

      {activeSlots.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center font-body text-sm text-off-white/50">
          No open times right now. Check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[11rem_1fr]">
          <div className="flex flex-row gap-2 overflow-x-auto md:flex-col">
            {days.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setDayKey(day.key);
                  setSelected(null);
                }}
                className={[
                  "shrink-0 rounded-xl border px-3 py-2 text-left font-body text-sm transition",
                  dayKey === day.key
                    ? "border-orange/50 bg-orange/15 text-orange"
                    : "border-off-white/10 text-off-white/70 hover:border-off-white/25",
                ].join(" ")}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl p-4">
            {!dayKey && (
              <p className="font-body text-sm text-off-white/45">Select a day to see times.</p>
            )}
            {dayKey && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {daySlots.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => setSelected(slot)}
                    className={[
                      "rounded-lg border px-3 py-2 font-body text-sm transition",
                      selected?.startsAt === slot.startsAt
                        ? "border-cyan/50 bg-cyan/15 text-cyan"
                        : "border-off-white/15 text-off-white/80 hover:border-cyan/30",
                    ].join(" ")}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <form
          className="glass flex flex-col gap-3 rounded-2xl p-6"
          action={(formData) => {
            formData.set("startsAt", selected.startsAt);
            if (typeId) formData.set("meetingTypeId", typeId);
            startTransition(async () => {
              const result = await bookAppointment(slug, formData);
              if (result.error) setError(result.error);
              else {
                setError(null);
                setDoneUrl(result.guestJoinUrl ?? null);
              }
            });
          }}
        >
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Your details</h2>
          <p className="font-body text-xs text-off-white/45">
            Booking {activeTitle} · {selected.label} ({timezone})
          </p>
          <input name="bookerName" required placeholder="Your name" className={fieldClass} />
          <input
            name="bookerEmail"
            type="email"
            required
            placeholder="Email"
            className={fieldClass}
          />
          <textarea
            name="notes"
            rows={2}
            placeholder="Anything we should know? (optional)"
            className={fieldClass}
          />
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
          >
            {isPending ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}

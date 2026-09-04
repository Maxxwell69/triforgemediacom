"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addBookingOpenSlot,
  createBookingMeetingType,
  deleteBookingMeetingType,
  deleteBookingOpenSlot,
  ensureBookingPage,
  setBookingWeeklyWindows,
  updateBookingMeetingType,
  updateBookingPageSettings,
} from "@/app/(community)/account/bookingActions";
import { BOOKING_TIMEZONES, DAY_LABELS, minutesToLabel } from "@/lib/bookingClient";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

type WindowRow = {
  key: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

type PageProps = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  timezone: string;
  durationMins: number;
  bufferMins: number;
  aheadDays: number;
  isActive: boolean;
  remindHourBefore: boolean;
  bookingUrl: string;
  weeklyWindows: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  meetingTypes: {
    id: string;
    title: string;
    description: string | null;
    durationMins: number;
    isActive: boolean;
  }[];
  openSlots: { id: string; startsAt: string; endsAt: string; label: string | null }[];
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => i * 30);

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BookingSchedulePanel({
  page: initialPage,
}: {
  page: PageProps | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [windows, setWindows] = useState<WindowRow[]>(() =>
    (initialPage?.weeklyWindows ?? []).map((w) => ({ ...w, key: newKey() }))
  );

  const byDay = useMemo(() => {
    const map = new Map<number, WindowRow[]>();
    for (let d = 0; d < 7; d++) map.set(d, []);
    for (const w of windows) map.get(w.dayOfWeek)?.push(w);
    return map;
  }, [windows]);

  if (!initialPage) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="font-body text-sm text-off-white/70">
          Set up a Calendly-style booking page. Guests pick a time, get a join link by email, and a
          private webinar room is created for the meeting.
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await ensureBookingPage();
              router.refresh();
            })
          }
          className="mt-4 rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
        >
          {isPending ? "Setting up…" : "Create booking page"}
        </button>
      </div>
    );
  }

  return (
    <div className="glass flex flex-col gap-6 rounded-2xl p-6">
      <div>
        <p className="font-body text-sm text-off-white/70">
          Share your link so people can schedule time with you. Confirmed bookings email both
          sides and spin up a private webinar room for the call.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="break-all rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-1.5 font-body text-xs text-cyan">
            {initialPage.bookingUrl}
          </code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(initialPage.bookingUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-xs text-off-white/70 hover:border-cyan/40 hover:text-cyan"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      <form
        className="flex flex-col gap-3"
        action={(formData) => {
          startTransition(async () => {
            const result = await updateBookingPageSettings(formData);
            setError(result.error);
            if (!result.error) router.refresh();
          });
        }}
      >
        <h3 className="font-display text-lg tracking-wide text-off-white/80">Page settings</h3>
        <input name="title" defaultValue={initialPage.title} required className={fieldClass} />
        <textarea
          name="description"
          defaultValue={initialPage.description ?? ""}
          rows={2}
          placeholder="What this meeting is for"
          className={fieldClass}
        />
        <label className="font-body text-xs text-off-white/50">
          Link slug
          <input
            name="slug"
            defaultValue={initialPage.slug}
            required
            className={`${fieldClass} mt-1`}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="timezone" defaultValue={initialPage.timezone} className={fieldClass}>
            {BOOKING_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <select
            name="durationMins"
            defaultValue={String(initialPage.durationMins)}
            className={fieldClass}
          >
            {[15, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
          <select
            name="bufferMins"
            defaultValue={String(initialPage.bufferMins)}
            className={fieldClass}
          >
            {[0, 5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>
                {m} min buffer
              </option>
            ))}
          </select>
          <select
            name="aheadDays"
            defaultValue={String(initialPage.aheadDays)}
            className={fieldClass}
          >
            {[7, 14, 21, 30, 45].map((d) => (
              <option key={d} value={d}>
                {d} days ahead
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={initialPage.isActive}
            className="accent-orange"
          />
          Booking page is active
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="remindHourBefore"
            defaultChecked={initialPage.remindHourBefore}
            className="accent-orange"
          />
          Offer a 1-hour reminder email (guest can opt in)
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal disabled:opacity-40"
        >
          Save settings
        </button>
      </form>

      <div>
        <h3 className="font-display text-lg tracking-wide text-off-white/80">
          Weekly availability
        </h3>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Times are in {initialPage.timezone}. Add open hours for each day.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {DAY_LABELS.map((label, dayOfWeek) => {
            const dayWindows = byDay.get(dayOfWeek) ?? [];
            return (
              <div key={label} className="rounded-xl border border-off-white/10 px-3 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-off-white">{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setWindows((prev) => [
                        ...prev,
                        {
                          key: newKey(),
                          dayOfWeek,
                          startMinute: 9 * 60,
                          endMinute: 17 * 60,
                        },
                      ])
                    }
                    className="font-body text-xs text-cyan hover:underline"
                  >
                    + Hours
                  </button>
                </div>
                {dayWindows.length === 0 && (
                  <p className="font-body text-xs text-off-white/35">Unavailable</p>
                )}
                {dayWindows.map((w) => (
                  <div key={w.key} className="mb-2 flex flex-wrap items-center gap-2">
                    <select
                      value={w.startMinute}
                      onChange={(e) => {
                        const startMinute = Number(e.target.value);
                        setWindows((prev) =>
                          prev.map((row) =>
                            row.key === w.key ? { ...row, startMinute } : row
                          )
                        );
                      }}
                      className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white"
                    >
                      {TIME_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {minutesToLabel(m)}
                        </option>
                      ))}
                    </select>
                    <span className="font-body text-xs text-off-white/40">to</span>
                    <select
                      value={w.endMinute}
                      onChange={(e) => {
                        const endMinute = Number(e.target.value);
                        setWindows((prev) =>
                          prev.map((row) =>
                            row.key === w.key ? { ...row, endMinute } : row
                          )
                        );
                      }}
                      className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white"
                    >
                      {[...TIME_OPTIONS.filter((m) => m > 0), 24 * 60].map((m) => (
                        <option key={m} value={m}>
                          {m === 24 * 60 ? "12:00 AM (end)" : minutesToLabel(m)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setWindows((prev) => prev.filter((row) => row.key !== w.key))
                      }
                      className="font-body text-xs text-orange/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const payload = windows.map(({ dayOfWeek, startMinute, endMinute }) => ({
                dayOfWeek,
                startMinute,
                endMinute,
              }));
              const result = await setBookingWeeklyWindows(JSON.stringify(payload));
              setError(result.error);
              if (!result.error) router.refresh();
            })
          }
          className="mt-4 rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save weekly hours"}
        </button>
      </div>

      <div>
        <h3 className="font-display text-lg tracking-wide text-off-white/80">Meeting types</h3>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Guests pick a type (intro, strategy, etc.). Each type has its own length and lands on
          your hub calendar when booked.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {initialPage.meetingTypes.map((type) => (
            <form
              key={type.id}
              className="rounded-xl border border-off-white/10 p-3"
              action={(formData) => {
                startTransition(async () => {
                  const result = await updateBookingMeetingType(type.id, formData);
                  setError(result.error);
                  if (!result.error) router.refresh();
                });
              }}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem]">
                <input
                  name="title"
                  defaultValue={type.title}
                  required
                  className={fieldClass}
                />
                <select
                  name="durationMins"
                  defaultValue={String(type.durationMins)}
                  className={fieldClass}
                >
                  {[15, 30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                name="description"
                defaultValue={type.description ?? ""}
                rows={2}
                placeholder="What this meeting is for"
                className={`${fieldClass} mt-2`}
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 font-body text-xs text-off-white/60">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={type.isActive}
                    className="accent-orange"
                  />
                  Bookable
                </label>
                <button
                  type="submit"
                  disabled={isPending}
                  className="font-body text-xs text-cyan hover:underline disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (!confirm("Remove this meeting type?")) return;
                    startTransition(async () => {
                      const result = await deleteBookingMeetingType(type.id);
                      setError(result.error);
                      if (!result.error) router.refresh();
                    });
                  }}
                  className="font-body text-xs text-orange/80 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </form>
          ))}
        </div>
        <form
          className="mt-3 flex flex-col gap-2 rounded-xl border border-dashed border-off-white/15 p-3"
          action={(formData) => {
            startTransition(async () => {
              const result = await createBookingMeetingType(formData);
              setError(result.error);
              if (!result.error) router.refresh();
            });
          }}
        >
          <p className="font-body text-xs uppercase tracking-wider text-off-white/40">
            Add meeting type
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_7rem]">
            <input name="title" required placeholder="e.g. Strategy call" className={fieldClass} />
            <select name="durationMins" defaultValue="30" className={fieldClass}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <input
            name="description"
            placeholder="Optional description"
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs text-cyan disabled:opacity-40"
          >
            Add type
          </button>
        </form>
      </div>

      <div>
        <h3 className="font-display text-lg tracking-wide text-off-white/80">Fill open slots</h3>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Add extra one-off hours beyond the weekly schedule. Open times already hide hub
          calendar events, webinars, and other bookings so you don&apos;t double-book.
        </p>
        {initialPage.openSlots.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {initialPage.openSlots.map((slot) => (
              <li
                key={slot.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-off-white/10 px-3 py-2"
              >
                <span className="font-body text-xs text-off-white/70">
                  {slot.label ? `${slot.label} · ` : ""}
                  {new Date(slot.startsAt).toLocaleString([], {
                    timeZone: initialPage.timezone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {" – "}
                  {new Date(slot.endsAt).toLocaleTimeString([], {
                    timeZone: initialPage.timezone,
                    timeStyle: "short",
                  })}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteBookingOpenSlot(slot.id);
                      setError(result.error);
                      if (!result.error) router.refresh();
                    })
                  }
                  className="font-body text-xs text-orange/80 disabled:opacity-40"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
          action={(formData) => {
            startTransition(async () => {
              const result = await addBookingOpenSlot(formData);
              setError(result.error);
              if (!result.error) router.refresh();
            });
          }}
        >
          <input name="date" type="date" required className={fieldClass} />
          <input name="label" placeholder="Label (optional)" className={fieldClass} />
          <input name="start" type="time" required className={fieldClass} />
          <input name="end" type="time" required className={fieldClass} />
          <button
            type="submit"
            disabled={isPending}
            className="sm:col-span-2 self-start rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow disabled:opacity-40"
          >
            Add open hours
          </button>
        </form>
      </div>

      {error && <p className="font-body text-sm text-orange">{error}</p>}
    </div>
  );
}

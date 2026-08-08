"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CalendarEventItem = {
  id: string;
  title: string;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  webinarId: string | null;
  hostLabel: string | null;
};

const KIND_LABEL: Record<string, string> = {
  MEETING: "Meeting",
  EVENT: "Event",
  LIVE: "Live",
  WEBINAR: "Webinar",
  OTHER: "Other",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function EventsCalendar({ events }: { events: CalendarEventItem[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startPad = first.getDay(); // 0 Sun
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const items: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startPad; i++) {
      items.push({ date: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      items.push({ date, key: dayKey(date) });
    }
    return items;
  }, [cursor]);

  const selectedEvents = eventsByDay.get(dayKey(selected)) ?? [];
  const monthLabel = cursor.toLocaleString([], { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
          >
            ←
          </button>
          <h2 className="font-display text-2xl tracking-wide text-off-white">{monthLabel}</h2>
          <button
            type="button"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-body text-xs text-off-white/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, key }) => {
            if (!date) {
              return <div key={key} className="min-h-[3.25rem] rounded-lg" />;
            }
            const dayEvents = eventsByDay.get(key) ?? [];
            const isSelected = sameDay(date, selected);
            const isToday = sameDay(date, today);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(date)}
                className={[
                  "flex min-h-[3.25rem] flex-col items-center rounded-lg border px-1 py-1.5 transition",
                  isSelected
                    ? "border-orange/50 bg-orange/15"
                    : "border-transparent hover:border-off-white/15 hover:bg-off-white/5",
                  isToday && !isSelected ? "border-cyan/30" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-body text-sm",
                    isSelected ? "font-semibold text-orange" : "text-off-white/80",
                  ].join(" ")}
                >
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="mt-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="h-1.5 w-1.5 rounded-full bg-cyan"
                        title={e.title}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <h3 className="font-display text-xl tracking-wide text-off-white/80">
          {selected.toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          {selectedEvents.length === 0 && (
            <p className="glass rounded-xl p-5 text-center font-body text-sm text-off-white/40">
              No events scheduled this day.
            </p>
          )}
          {selectedEvents.map((event) => {
            const start = new Date(event.startsAt);
            const end = event.endsAt ? new Date(event.endsAt) : null;
            const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            const endTime = end
              ? end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : null;
            return (
              <div key={event.id} className="glass rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-off-white">
                      <span className="mr-2 text-xs text-cyan">
                        {KIND_LABEL[event.kind] || event.kind}
                      </span>
                      {event.title}
                    </p>
                    <p className="mt-1 font-body text-xs text-off-white/45">
                      {time}
                      {endTime ? ` – ${endTime}` : ""}
                      {event.location ? ` · ${event.location}` : ""}
                      {event.hostLabel ? ` · ${event.hostLabel}` : ""}
                    </p>
                    {event.description && (
                      <p className="mt-2 font-body text-xs text-off-white/55">{event.description}</p>
                    )}
                  </div>
                  {event.webinarId && (
                    <Link
                      href={`/webinars/${event.webinarId}`}
                      className="shrink-0 rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs font-semibold text-cyan"
                    >
                      Open webinar
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

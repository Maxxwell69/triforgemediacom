"use client";

import { type MouseEvent, useMemo, useState } from "react";
import Link from "next/link";

type DayRipple = {
  id: string;
  cellKey: string;
  x: number;
  y: number;
};

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

type CalendarView = "month" | "week" | "agenda";

const KIND_LABEL: Record<string, string> = {
  MEETING: "Meeting",
  EVENT: "Event",
  LIVE: "Live",
  WEBINAR: "Webinar",
  OTHER: "Other",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type KindAccent = {
  chip: string;
  bar: string;
  pill: string;
  dot: string;
};

function kindAccent(kind: string): KindAccent {
  switch (kind) {
    case "WEBINAR":
      return {
        chip: "bg-cyan/20 text-cyan border-cyan/30",
        bar: "bg-cyan",
        pill: "text-cyan border-cyan/40 bg-cyan/10",
        dot: "bg-cyan",
      };
    case "LIVE":
      return {
        chip: "bg-orange/20 text-orange border-orange/30",
        bar: "bg-orange",
        pill: "text-orange border-orange/40 bg-orange/10",
        dot: "bg-orange",
      };
    case "MEETING":
      return {
        chip: "bg-[#3B82F6]/15 text-[#93C5FD] border-[#3B82F6]/30",
        bar: "bg-[#3B82F6]",
        pill: "text-[#93C5FD] border-[#3B82F6]/40 bg-[#3B82F6]/10",
        dot: "bg-[#3B82F6]",
      };
    case "EVENT":
      return {
        chip: "bg-cyan/10 text-off-white border-cyan/25",
        bar: "bg-cyan/70",
        pill: "text-off-white/80 border-cyan/30 bg-cyan/5",
        dot: "bg-cyan/70",
      };
    default:
      return {
        chip: "bg-off-white/10 text-off-white/70 border-off-white/20",
        bar: "bg-off-white/40",
        pill: "text-off-white/60 border-off-white/25 bg-off-white/5",
        dot: "bg-off-white/40",
      };
  }
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatTimeRange(startsAt: string, endsAt: string | null) {
  const start = formatTime(startsAt);
  if (!endsAt) return start;
  return `${start} – ${formatTime(endsAt)}`;
}

function EventChip({ event, compact }: { event: CalendarEventItem; compact?: boolean }) {
  const accent = kindAccent(event.kind);
  return (
    <span
      title={`${KIND_LABEL[event.kind] || event.kind}: ${event.title}`}
      className={[
        "block w-full truncate rounded border px-1 font-body leading-tight transition",
        accent.chip,
        compact ? "py-0.5 text-[9px] sm:text-[10px]" : "py-0.5 text-[10px] sm:text-[11px]",
      ].join(" ")}
    >
      <span className="opacity-80">{formatTime(event.startsAt)}</span>{" "}
      {event.title}
    </span>
  );
}

function EventDetailCard({ event }: { event: CalendarEventItem }) {
  const accent = kindAccent(event.kind);
  return (
    <div className="glass relative overflow-hidden rounded-xl p-4 transition hover:border-off-white/20">
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${accent.pill}`}
            >
              {KIND_LABEL[event.kind] || event.kind}
            </span>
            <p className="font-body text-sm font-medium text-off-white">{event.title}</p>
          </div>
          <p className="mt-1.5 font-body text-xs text-off-white/45">
            {formatTimeRange(event.startsAt, event.endsAt)}
            {event.location ? ` · ${event.location}` : ""}
            {event.hostLabel ? ` · ${event.hostLabel}` : ""}
          </p>
          {event.description && (
            <p className="mt-2 font-body text-xs leading-relaxed text-off-white/55">
              {event.description}
            </p>
          )}
        </div>
        {event.webinarId && (
          <Link
            href={`/webinars/${event.webinarId}`}
            className="shrink-0 rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/20"
          >
            Open webinar
          </Link>
        )}
      </div>
    </div>
  );
}

export default function EventsCalendar({ events }: { events: CalendarEventItem[] }) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [ripple, setRipple] = useState<DayRipple | null>(null);
  const today = useMemo(() => new Date(), []);

  function selectDay(date: Date, cellKey: string, e: MouseEvent<HTMLButtonElement>) {
    setSelected(date);
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const id = `${cellKey}-${Date.now()}`;
    setRipple({
      id,
      cellKey,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    window.setTimeout(() => {
      setRipple((current) => (current?.id === id ? null : current));
    }, 500);
  }

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of Array.from(map.values())) {
      list.sort(
        (a: CalendarEventItem, b: CalendarEventItem) =>
          +new Date(a.startsAt) - +new Date(b.startsAt)
      );
    }
    return map;
  }, [events]);

  const monthCells = useMemo(() => {
    const first = startOfMonth(cursor);
    const startPad = first.getDay();
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

  const weekDays = useMemo(() => {
    const start = startOfWeek(selected);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selected]);

  const agendaGroups = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = addDays(start, 30);
    const upcoming = events
      .filter((e) => {
        const d = new Date(e.startsAt);
        return d >= start && d < end;
      })
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

    const groups: Array<{ date: Date; key: string; events: CalendarEventItem[] }> = [];
    for (const event of upcoming) {
      const d = new Date(event.startsAt);
      const key = dayKey(d);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.events.push(event);
      } else {
        groups.push({
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          key,
          events: [event],
        });
      }
    }
    return groups;
  }, [events, today]);

  const selectedEvents = eventsByDay.get(dayKey(selected)) ?? [];
  const monthLabel = cursor.toLocaleString([], { month: "long", year: "numeric" });
  const weekLabel = `${weekDays[0].toLocaleDateString([], {
    month: "short",
    day: "numeric",
  })} – ${weekDays[6].toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  function goToday() {
    const now = new Date();
    setSelected(now);
    setCursor(startOfMonth(now));
  }

  function shiftMonth(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  function shiftWeek(delta: number) {
    const next = addDays(selected, delta * 7);
    setSelected(next);
    setCursor(startOfMonth(next));
  }

  const navLabel = view === "week" ? weekLabel : monthLabel;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-off-white/10 bg-gradient-to-b from-off-white/[0.04] to-transparent px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            {(view === "month" || view === "week") && (
              <>
                <button
                  type="button"
                  onClick={() => (view === "week" ? shiftWeek(-1) : shiftMonth(-1))}
                  className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
                  aria-label="Previous"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => (view === "week" ? shiftWeek(1) : shiftMonth(1))}
                  className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
                  aria-label="Next"
                >
                  →
                </button>
              </>
            )}
            <h2
              key={`${view}-${navLabel}`}
              className="font-display text-2xl tracking-wide text-off-white animate-[hubFadeUp_0.35s_ease-out_both]"
            >
              {view === "agenda" ? "Coming up" : navLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-cyan/35 bg-cyan/10 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/20"
            >
              Today
            </button>
            <div className="flex rounded-lg border border-off-white/15 bg-charcoal/40 p-0.5">
              {(
                [
                  ["month", "Month"],
                  ["week", "Week"],
                  ["agenda", "Agenda"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={[
                    "rounded-md px-3 py-1.5 font-body text-xs font-semibold transition",
                    view === id
                      ? "bg-orange/90 text-charcoal shadow-sm"
                      : "text-off-white/55 hover:text-off-white",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {view === "month" && (
            <>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center font-body text-[11px] font-semibold uppercase tracking-wider text-off-white/35">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div
                key={monthLabel}
                className="grid grid-cols-7 gap-1 animate-[hubFadeUp_0.3s_ease-out_both]"
              >
                {monthCells.map(({ date, key }) => {
                  if (!date) {
                    return (
                      <div
                        key={key}
                        className="min-h-[4.5rem] rounded-xl bg-off-white/[0.02] sm:min-h-[5.75rem]"
                      />
                    );
                  }
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const isSelected = sameDay(date, selected);
                  const isToday = sameDay(date, today);
                  const overflow = Math.max(0, dayEvents.length - 2);
                  const cellRipple = ripple?.cellKey === key ? ripple : null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={(e) => selectDay(date, key, e)}
                      className={[
                        "cal-day-cell flex min-h-[4.5rem] flex-col items-stretch rounded-xl border px-1 py-1.5 text-left sm:min-h-[5.75rem] sm:px-1.5",
                        isSelected
                          ? "cal-day-cell--selected border-orange/55 bg-orange/15 shadow-[0_0_0_1px_rgba(253,72,2,0.15)]"
                          : "border-off-white/8 bg-off-white/[0.03]",
                        isToday && !isSelected ? "ring-1 ring-cyan/45" : "",
                      ].join(" ")}
                    >
                      {cellRipple && (
                        <span
                          className="cal-day-cell__ripple"
                          style={{ left: cellRipple.x, top: cellRipple.y }}
                          aria-hidden
                        />
                      )}
                      <span
                        className={[
                          "relative mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full font-body text-xs",
                          isSelected
                            ? "bg-orange font-semibold text-charcoal"
                            : isToday
                              ? "font-semibold text-cyan"
                              : "text-off-white/75",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </span>
                      <div className="relative hidden flex-col gap-0.5 sm:flex">
                        {dayEvents.slice(0, 2).map((e) => (
                          <EventChip key={e.id} event={e} compact />
                        ))}
                        {overflow > 0 && (
                          <span className="px-0.5 font-body text-[10px] text-off-white/40">
                            +{overflow} more
                          </span>
                        )}
                      </div>
                      <div className="relative mt-auto flex justify-center gap-0.5 pt-1 sm:hidden">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className={`h-1.5 w-1.5 rounded-full ${kindAccent(e.kind).dot}`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "week" && (
            <div
              key={weekLabel}
              className="grid grid-cols-1 gap-2 sm:grid-cols-7 animate-[hubFadeUp_0.3s_ease-out_both]"
            >
              {weekDays.map((date) => {
                const key = dayKey(date);
                const dayEvents = eventsByDay.get(key) ?? [];
                const isSelected = sameDay(date, selected);
                const isToday = sameDay(date, today);
                const cellRipple = ripple?.cellKey === key ? ripple : null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => selectDay(date, key, e)}
                    className={[
                      "cal-day-cell flex min-h-[10rem] flex-col items-stretch rounded-xl border p-2 text-left",
                      isSelected
                        ? "cal-day-cell--selected border-orange/55 bg-orange/15"
                        : "border-off-white/8 bg-off-white/[0.03]",
                      isToday && !isSelected ? "ring-1 ring-cyan/45" : "",
                    ].join(" ")}
                  >
                    {cellRipple && (
                      <span
                        className="cal-day-cell__ripple"
                        style={{ left: cellRipple.x, top: cellRipple.y }}
                        aria-hidden
                      />
                    )}
                    <div className="relative mb-2 flex items-baseline justify-between gap-1">
                      <span className="font-body text-[10px] uppercase tracking-wide text-off-white/40">
                        {WEEKDAYS[date.getDay()]}
                      </span>
                      <span
                        className={[
                          "inline-flex h-6 w-6 items-center justify-center rounded-full font-body text-xs",
                          isSelected
                            ? "bg-orange font-semibold text-charcoal"
                            : isToday
                              ? "font-semibold text-cyan"
                              : "text-off-white/80",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="relative flex flex-col gap-1">
                      {dayEvents.length === 0 && (
                        <span className="font-body text-[10px] text-off-white/25">—</span>
                      )}
                      {dayEvents.map((e) => (
                        <EventChip key={e.id} event={e} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {view === "agenda" && (
            <div className="flex flex-col gap-5 animate-[hubFadeUp_0.3s_ease-out_both]">
              {agendaGroups.length === 0 && (
                <p className="rounded-xl border border-dashed border-off-white/15 px-5 py-10 text-center font-body text-sm text-off-white/40">
                  Nothing on the schedule for the next 30 days.
                </p>
              )}
              {agendaGroups.map((group) => (
                <section key={group.key}>
                  <h3 className="mb-2 font-display text-lg tracking-wide text-off-white/75">
                    {group.date.toLocaleDateString([], {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    {sameDay(group.date, today) && (
                      <span className="ml-2 font-body text-xs font-semibold text-cyan">Today</span>
                    )}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {group.events.map((event) => (
                      <EventDetailCard key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {(view === "month" || view === "week") && (
        <section
          key={dayKey(selected)}
          className="animate-[hubFadeUp_0.28s_ease-out_both]"
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-display text-2xl tracking-wide text-off-white/85">
              {selected.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <p className="font-body text-xs text-off-white/40">
              {selectedEvents.length === 0
                ? "Open day"
                : `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {selectedEvents.length === 0 && (
              <p className="rounded-xl border border-dashed border-off-white/15 px-5 py-8 text-center font-body text-sm text-off-white/40">
                No events scheduled this day.
              </p>
            )}
            {selectedEvents.map((event) => (
              <EventDetailCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

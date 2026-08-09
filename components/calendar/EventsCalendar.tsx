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
  groupId: string | null;
  groupName: string | null;
  groupColor: string | null;
};

export type CalendarFilterGroup = {
  id: string;
  name: string;
  color: string;
  isHome: boolean;
};

type CalendarView = "month" | "week" | "day" | "agenda";
type CalendarFilter = "all" | "hub" | string;

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

function EventDetailCard({
  event,
  large,
}: {
  event: CalendarEventItem;
  large?: boolean;
}) {
  const accent = kindAccent(event.kind);
  return (
    <Link
      href={`/calendar/events/${event.id}`}
      className={[
        "glass relative block overflow-hidden rounded-xl transition hover:border-orange/35 hover:shadow-glow",
        large ? "p-5" : "p-4",
      ].join(" ")}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${accent.pill}`}
            >
              {KIND_LABEL[event.kind] || event.kind}
            </span>
            {event.groupName && (
              <span className="rounded-md border border-off-white/15 px-1.5 py-0.5 font-body text-[10px] text-off-white/50">
                {event.groupName}
              </span>
            )}
            <p
              className={[
                "font-medium text-off-white",
                large ? "font-display text-xl tracking-wide" : "font-body text-sm",
              ].join(" ")}
            >
              {event.title}
            </p>
          </div>
          <p className="mt-1.5 font-body text-xs text-off-white/45">
            {formatTimeRange(event.startsAt, event.endsAt)}
            {event.location ? ` · ${event.location}` : ""}
            {event.hostLabel ? ` · ${event.hostLabel}` : ""}
          </p>
          {event.description && (
            <p
              className={[
                "mt-2 font-body leading-relaxed text-off-white/55",
                large ? "text-sm" : "text-xs line-clamp-2",
              ].join(" ")}
            >
              {event.description}
            </p>
          )}
        </div>
        <span className="shrink-0 font-body text-xs font-semibold text-cyan">
          {event.webinarId ? "Webinar →" : "View →"}
        </span>
      </div>
    </Link>
  );
}

export default function EventsCalendar({
  events,
  filterGroups = [],
}: {
  events: CalendarEventItem[];
  filterGroups?: CalendarFilterGroup[];
}) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [ripple, setRipple] = useState<DayRipple | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const today = useMemo(() => new Date(), []);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "hub") {
      return events.filter((e) => !e.groupId);
    }
    return events.filter((e) => e.groupId === filter);
  }, [events, filter]);

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
    for (const event of filteredEvents) {
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
  }, [filteredEvents]);

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
    const upcoming = filteredEvents
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
  }, [filteredEvents, today]);

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
  const dayLabel = selected.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

  function shiftDay(delta: number) {
    const next = addDays(selected, delta);
    setSelected(next);
    setCursor(startOfMonth(next));
  }

  function openFullDay(date: Date = selected) {
    setSelected(date);
    setCursor(startOfMonth(date));
    setView("day");
  }

  const navLabel =
    view === "week" ? weekLabel : view === "day" ? dayLabel : monthLabel;

  return (
    <div className="flex flex-col gap-6">
      {filterGroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/35">
            Calendars
          </span>
          {(
            [
              ["all", "All"],
              ["hub", "Hub"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                "rounded-full border px-3 py-1 font-body text-xs font-semibold transition",
                filter === id
                  ? "border-orange/50 bg-orange/15 text-orange"
                  : "border-off-white/10 bg-off-white/[0.03] text-off-white/55 hover:border-off-white/25 hover:text-off-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          {filterGroups
            .filter((g) => !g.isHome)
            .map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilter(g.id)}
                className={[
                  "rounded-full border px-3 py-1 font-body text-xs font-semibold transition",
                  filter === g.id
                    ? "border-orange/50 bg-orange/15 text-orange"
                    : "border-off-white/10 bg-off-white/[0.03] text-off-white/55 hover:border-off-white/25 hover:text-off-white",
                ].join(" ")}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                {g.name}
              </button>
            ))}
        </div>
      )}

      <div className="glass overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-off-white/10 bg-gradient-to-b from-off-white/[0.04] to-transparent px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            {(view === "month" || view === "week" || view === "day") && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    view === "day"
                      ? shiftDay(-1)
                      : view === "week"
                        ? shiftWeek(-1)
                        : shiftMonth(-1)
                  }
                  className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
                  aria-label="Previous"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() =>
                    view === "day"
                      ? shiftDay(1)
                      : view === "week"
                        ? shiftWeek(1)
                        : shiftMonth(1)
                  }
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
            <div className="flex flex-wrap rounded-lg border border-off-white/15 bg-charcoal/40 p-0.5">
              {(
                [
                  ["month", "Month"],
                  ["week", "Week"],
                  ["day", "Day"],
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
                className="grid grid-cols-7 gap-2 animate-[hubFadeUp_0.3s_ease-out_both]"
              >
                {monthCells.map(({ date, key }) => {
                  if (!date) {
                    return (
                      <div
                        key={key}
                        className="min-h-[4.5rem] rounded-2xl sm:min-h-[5.75rem]"
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
                        "cal-day-cell flex min-h-[4.5rem] flex-col items-stretch rounded-2xl px-1.5 py-2 text-left sm:min-h-[5.75rem] sm:px-2",
                        isSelected ? "cal-day-cell--selected" : "",
                        isToday && !isSelected ? "ring-1 ring-inset ring-cyan/35" : "",
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
                      "cal-day-cell flex min-h-[10rem] flex-col items-stretch rounded-2xl p-3 text-left",
                      isSelected ? "cal-day-cell--selected" : "",
                      isToday && !isSelected ? "ring-1 ring-inset ring-cyan/35" : "",
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

          {view === "day" && (
            <div
              key={dayLabel}
              className="flex min-h-[28rem] flex-col gap-4 animate-[hubFadeUp_0.3s_ease-out_both]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-sm text-off-white/50">
                  {selectedEvents.length === 0
                    ? "Nothing scheduled — enjoy the open day."
                    : `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"} today`}
                  {sameDay(selected, today) ? " · Today" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className="font-body text-xs text-off-white/45 transition hover:text-cyan"
                >
                  Back to month
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {selectedEvents.length === 0 && (
                  <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-off-white/15 px-5 py-16 text-center font-body text-sm text-off-white/40">
                    No events on this day.
                  </p>
                )}
                {selectedEvents.map((event) => (
                  <EventDetailCard key={event.id} event={event} large />
                ))}
              </div>
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
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg tracking-wide text-off-white/75">
                      {group.date.toLocaleDateString([], {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      {sameDay(group.date, today) && (
                        <span className="ml-2 font-body text-xs font-semibold text-cyan">
                          Today
                        </span>
                      )}
                    </h3>
                    <button
                      type="button"
                      onClick={() => openFullDay(group.date)}
                      className="font-body text-xs font-semibold text-cyan transition hover:text-off-white"
                    >
                      Open day
                    </button>
                  </div>
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
            <div className="flex items-center gap-3">
              <p className="font-body text-xs text-off-white/40">
                {selectedEvents.length === 0
                  ? "No events"
                  : `${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}`}
              </p>
              <button
                type="button"
                onClick={() => openFullDay()}
                className="rounded-lg border border-cyan/35 bg-cyan/10 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/20"
              >
                Open full day
              </button>
            </div>
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

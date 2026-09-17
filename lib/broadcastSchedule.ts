/** Hub 0 broadcast clocks run in Eastern unless an admin overrides timezone. */
export const BROADCAST_TZ = "America/New_York";

export type BroadcastRecurrenceKind = "DAILY" | "WEEKLY" | "MONTHLY";

export type RecurrenceSpec = {
  recurrence: BroadcastRecurrenceKind;
  hour: number;
  minute: number;
  weekday?: number | null;
  monthDay?: number | null;
  timeZone?: string;
};

const WEEKDAY_FROM_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function civilInZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY_FROM_SHORT[parts.weekday ?? "Sun"] ?? 0,
  };
}

/** UTC instant for a civil wall-clock time in `timeZone`. */
export function zonedCivilToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  let guess = Date.parse(`${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00.000Z`);
  for (let i = 0; i < 4; i++) {
    const got = civilInZone(new Date(guess), timeZone);
    const gotUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
    const wantUtc = Date.UTC(year, month - 1, day, hour, minute);
    const delta = wantUtc - gotUtc;
    if (delta === 0) break;
    guess += delta;
  }
  return new Date(guess);
}

function addCalendarDays(year: number, month: number, day: number, amount: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + amount));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function atLocal(spec: RecurrenceSpec, year: number, month: number, day: number): Date {
  const tz = spec.timeZone || BROADCAST_TZ;
  const hour = clamp(Math.trunc(spec.hour), 0, 23);
  const minute = clamp(Math.trunc(spec.minute), 0, 59);
  return zonedCivilToUtc(tz, year, month, day, hour, minute);
}

/**
 * Next fire time strictly after `after` (usually now).
 * Weekly uses scheduleWeekday (JS: 0 Sunday … 6 Saturday).
 * Monthly clamps scheduleMonthDay to the last day of that month.
 */
export function nextBroadcastRunAt(spec: RecurrenceSpec, after = new Date()): Date {
  const tz = spec.timeZone || BROADCAST_TZ;
  const now = civilInZone(after, tz);
  const hour = clamp(Math.trunc(spec.hour), 0, 23);
  const minute = clamp(Math.trunc(spec.minute), 0, 59);

  if (spec.recurrence === "DAILY") {
    let candidate = atLocal(spec, now.year, now.month, now.day);
    if (candidate.getTime() <= after.getTime()) {
      const next = addCalendarDays(now.year, now.month, now.day, 1);
      candidate = atLocal(spec, next.year, next.month, next.day);
    }
    return candidate;
  }

  if (spec.recurrence === "WEEKLY") {
    const wantWeekday = clamp(Math.trunc(spec.weekday ?? now.weekday), 0, 6);
    for (let i = 0; i < 8; i++) {
      const d = addCalendarDays(now.year, now.month, now.day, i);
      const candidate = atLocal(spec, d.year, d.month, d.day);
      const civil = civilInZone(candidate, tz);
      if (civil.weekday === wantWeekday && candidate.getTime() > after.getTime()) {
        return candidate;
      }
    }
    const fallback = addCalendarDays(now.year, now.month, now.day, 7);
    return atLocal(spec, fallback.year, fallback.month, fallback.day);
  }

  const wantDay = clamp(Math.trunc(spec.monthDay ?? now.day), 1, 31);
  for (let monthOffset = 0; monthOffset < 14; monthOffset++) {
    const cursor = new Date(Date.UTC(now.year, now.month - 1 + monthOffset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const day = Math.min(wantDay, daysInMonth(year, month));
    const candidate = atLocal({ ...spec, hour, minute }, year, month, day);
    if (candidate.getTime() > after.getTime()) return candidate;
  }

  const nextYear = new Date(Date.UTC(now.year + 1, 0, 1));
  return atLocal(spec, nextYear.getUTCFullYear(), 1, Math.min(wantDay, 31));
}

export function formatBroadcastWhen(date: Date, timeZone = BROADCAST_TZ) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function recurrenceLabel(spec: {
  recurrence: "NONE" | BroadcastRecurrenceKind;
  hour: number;
  minute: number;
  weekday?: number | null;
  monthDay?: number | null;
}) {
  const time = `${((spec.hour + 11) % 12) + 1}:${pad2(spec.minute)} ${spec.hour >= 12 ? "PM" : "AM"} ET`;
  if (spec.recurrence === "DAILY") return `Every day at ${time}`;
  if (spec.recurrence === "WEEKLY") {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = names[clamp(spec.weekday ?? 1, 0, 6)];
    return `Every ${day} at ${time}`;
  }
  if (spec.recurrence === "MONTHLY") {
    const n = spec.monthDay ?? 1;
    const suffix = n === 1 || n === 21 || n === 31 ? "st" : n === 2 || n === 22 ? "nd" : n === 3 || n === 23 ? "rd" : "th";
    return `Monthly on the ${n}${suffix} at ${time}`;
  }
  return "Does not repeat";
}

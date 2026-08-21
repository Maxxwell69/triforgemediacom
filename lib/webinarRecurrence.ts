import { localWallTimeToUtc } from "@/lib/time";

const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const MAX_OCCURRENCES = 40;
const MAX_WEEKS = 12;

function zonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    weekday: WEEKDAY_SHORT[map.weekday] ?? 0,
  };
}

function addCalendarDays(year: number, month: number, day: number, offset: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function parseRepeatWeekdays(formData: FormData): number[] {
  const raw = formData.getAll("repeatDay").map((v) => Number(v)).filter((n) => n >= 0 && n <= 6);
  const unique: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    if (!unique.includes(raw[i])) unique.push(raw[i]);
  }
  return unique;
}

/**
 * Expand a weekly webinar into concrete start times in the host timezone.
 * Always includes `first` (the scheduled datetime from the form).
 */
export function expandWeeklyWebinarTimes(
  first: Date,
  timeZone: string,
  weekdays: number[],
  weekCount: number
): Date[] {
  const weeks = Math.min(MAX_WEEKS, Math.max(1, Math.floor(weekCount) || 1));
  const firstParts = zonedParts(first, timeZone);
  const days = weekdays.length > 0 ? weekdays : [firstParts.weekday];
  const allowed: number[] = [];
  for (let i = 0; i < days.length; i += 1) {
    const d = days[i];
    if (d >= 0 && d <= 6 && !allowed.includes(d)) allowed.push(d);
  }

  const out: Date[] = [];
  const firstMs = first.getTime();

  for (let offset = 0; offset < weeks * 7; offset += 1) {
    const wall = addCalendarDays(firstParts.year, firstParts.month, firstParts.day, offset);
    const occ = localWallTimeToUtc(
      timeZone,
      wall.year,
      wall.month,
      wall.day,
      firstParts.hour,
      firstParts.minute
    );
    const occWeekday = zonedParts(occ, timeZone).weekday;
    if (!allowed.includes(occWeekday)) continue;
    if (occ.getTime() + 60_000 < firstMs) continue;
    out.push(occ);
    if (out.length >= MAX_OCCURRENCES) break;
  }

  const hasFirst = out.some((d) => Math.abs(d.getTime() - firstMs) < 60_000);
  if (!hasFirst) out.unshift(first);
  out.sort((a, b) => a.getTime() - b.getTime());
  return out.slice(0, MAX_OCCURRENCES);
}

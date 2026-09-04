/** Timezone helpers shared by booking, calendar, and webinars. */

export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return asUTC - date.getTime();
}

/** Convert a wall-clock time in `timeZone` to a UTC Date. */
export function localWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function isAbsoluteDateString(value: string) {
  return /Z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
}

/**
 * Parse a form datetime. ISO strings with Z/offset are instants.
 * Naive `datetime-local` values (`2026-08-18T15:30`) are wall-clock in `timeZone`
 * (the submitter’s device zone). Never treat those as UTC — Railway is UTC, which
 * is what made 3:30 PM EST show up as 11:30 AM.
 */
export function parseZonedDateTime(value: string, timeZone?: string | null, label = "Date"): Date {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Invalid ${label}`);

  if (isAbsoluteDateString(trimmed)) {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}`);
    return date;
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}`);
    return date;
  }

  const zone = (timeZone || "").trim();
  if (!zone) {
    throw new Error(`${label} needs a timezone. Refresh and try again.`);
  }

  return localWallTimeToUtc(
    zone,
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  );
}

export function formTimeZone(formData: FormData) {
  const raw = String(formData.get("timeZone") || "").trim();
  return raw || null;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse `YYYY-MM-DD` from `<input type="date">` as that calendar day.
 * `new Date("2026-09-07")` is UTC midnight; formatting it in US timezones
 * shows the previous day. Always store and display date-only values in UTC.
 */
export function parseDateOnly(value: string): Date | null {
  const match = value.trim().match(DATE_ONLY);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnly(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
}

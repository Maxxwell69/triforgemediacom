/** Client-safe calendar helpers (no server-only / Prisma). */

function asDate(value: Date | string): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

/** Do not mix dateStyle/timeStyle with timeZoneName — browsers throw "Invalid option". */
const WHEN_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

export function formatCalendarWhen(startsAt: Date | string, endsAt: Date | string | null) {
  const startDate = asDate(startsAt);
  if (!startDate) return "";
  try {
    const start = startDate.toLocaleString([], WHEN_OPTS);
    const endDate = endsAt == null ? null : asDate(endsAt);
    if (!endDate) return start;
    const sameDay = startDate.toDateString() === endDate.toDateString();
    const end = endDate.toLocaleString([], sameDay ? TIME_OPTS : WHEN_OPTS);
    return `${start} → ${end}`;
  } catch {
    return startDate.toLocaleString();
  }
}

/** Client-safe calendar helpers (no server-only / Prisma). */

function asDate(value: Date | string): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatCalendarWhen(startsAt: Date | string, endsAt: Date | string | null) {
  const startDate = asDate(startsAt);
  if (!startDate) return "";
  const start = startDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZoneName: "short",
  });
  const endDate = endsAt == null ? null : asDate(endsAt);
  if (!endDate) return start;
  const sameDay = startDate.toDateString() === endDate.toDateString();
  const endOpts: Intl.DateTimeFormatOptions = {
    timeStyle: "short",
    timeZoneName: "short",
  };
  if (!sameDay) endOpts.dateStyle = "medium";
  const end = endDate.toLocaleString([], endOpts);
  return `${start} → ${end}`;
}

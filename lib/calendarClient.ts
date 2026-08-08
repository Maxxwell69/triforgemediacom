/** Client-safe calendar helpers (no server-only / Prisma). */

export function formatCalendarWhen(startsAt: Date | string, endsAt: Date | string | null) {
  const startDate = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const endDate = endsAt == null ? null : typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const start = startDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  if (!endDate) return start;
  const sameDay = startDate.toDateString() === endDate.toDateString();
  const end = endDate.toLocaleString([], {
    dateStyle: sameDay ? undefined : "medium",
    timeStyle: "short",
  });
  return `${start} → ${end}`;
}

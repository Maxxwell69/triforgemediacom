"use client";

import { formatCalendarWhen } from "@/lib/calendarClient";

/** Format instants in the viewer’s device timezone (not Railway UTC). */
export default function LocalWhen({
  startsAt,
  endsAt = null,
}: {
  startsAt: Date | string;
  endsAt?: Date | string | null;
}) {
  return <>{formatCalendarWhen(startsAt, endsAt)}</>;
}

"use client";

import { useEffect, useState } from "react";
import { formatCalendarWhen } from "@/lib/calendarClient";

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

/** Format instants in the viewer’s device timezone after mount (avoids SSR UTC mismatch). */
export default function LocalWhen({
  startsAt,
  endsAt = null,
}: {
  startsAt: Date | string;
  endsAt?: Date | string | null;
}) {
  const startIso = toIso(startsAt);
  const endIso = toIso(endsAt);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!startIso) return;
    setLabel(formatCalendarWhen(startIso, endIso));
  }, [startIso, endIso]);

  if (!label) return <span className="inline-block min-h-[1em] min-w-[8rem]" aria-hidden />;
  return <>{label}</>;
}

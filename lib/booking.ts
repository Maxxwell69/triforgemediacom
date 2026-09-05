import "server-only";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { minutesToLabel, type OpenSlot } from "@/lib/bookingClient";
import { localWallTimeToUtc } from "@/lib/time";

export { BOOKING_TIMEZONES, DAY_LABELS, minutesToLabel } from "@/lib/bookingClient";
export type { OpenSlot } from "@/lib/bookingClient";
export { getTimeZoneOffsetMs, localWallTimeToUtc } from "@/lib/time";

export function bookingPageUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/book/${slug}`;
}

export function appointmentCancelUrl(cancelToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/book/cancel/${cancelToken}`;
}

export function suggestBookingSlug(email: string, name?: string | null): string {
  const base =
    (name || email.split("@")[0] || "host")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "host";
  return `${base}-${randomBytes(2).toString("hex")}`;
}

export function zonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    dayOfWeek: weekdayMap[map.weekday] ?? 0,
  };
}

type DateOverrideForSlots = {
  localDate: string;
  kind: "CLOSED" | "CUSTOM";
  windows: { startMinute: number; endMinute: number }[];
};

type PageForSlots = {
  timezone: string;
  durationMins: number;
  bufferMins: number;
  aheadDays: number;
  weeklyWindows: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  openSlots?: { startsAt: Date; endsAt: Date }[];
  dateOverrides?: DateOverrideForSlots[];
};

function localDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type BusyRange = { startsAt: Date; endsAt: Date };

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function assumeEnd(startsAt: Date, endsAt: Date | null, fallbackMins = 60) {
  return endsAt ?? new Date(startsAt.getTime() + fallbackMins * 60 * 1000);
}

export type BusyRangeOpts = {
  /** Ignore this appointment (and its mirrored calendar/webinar) when listing slots. */
  excludeAppointmentId?: string;
  excludeWebinarId?: string;
};

/** Busy times from appointments, hub calendar, webinars, and busy blocks. */
export async function listHostBusyRanges(
  hostUserId: string,
  from: Date,
  to: Date,
  opts?: BusyRangeOpts
): Promise<BusyRange[]> {
  const [appointments, events, busySlots, calendarBookings, webinars] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        hostUserId,
        status: "CONFIRMED",
        startsAt: { lt: to },
        endsAt: { gt: from },
        ...(opts?.excludeAppointmentId ? { id: { not: opts.excludeAppointmentId } } : {}),
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.calendarEvent.findMany({
      where: {
        AND: [
          {
            OR: [
              { createdById: hostUserId },
              { attendees: { some: { userId: hostUserId } } },
            ],
          },
          { startsAt: { lt: to } },
          { OR: [{ endsAt: null }, { endsAt: { gt: from } }] },
          ...(opts?.excludeWebinarId
            ? [{ NOT: { webinarId: opts.excludeWebinarId } }]
            : []),
        ],
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.availabilitySlot.findMany({
      where: {
        userId: hostUserId,
        kind: "BUSY",
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.calendarBooking.findMany({
      where: {
        hostId: hostUserId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.webinar.findMany({
      where: {
        hostUserId,
        status: { in: ["SCHEDULED", "LIVE"] },
        scheduledAt: { lt: to, gt: new Date(from.getTime() - 3 * 60 * 60 * 1000) },
        ...(opts?.excludeWebinarId ? { id: { not: opts.excludeWebinarId } } : {}),
      },
      select: { scheduledAt: true },
    }),
  ]);

  return [
    ...appointments,
    ...events.map((e) => ({ startsAt: e.startsAt, endsAt: assumeEnd(e.startsAt, e.endsAt) })),
    ...busySlots,
    ...calendarBookings,
    ...webinars.map((w) => ({
      startsAt: w.scheduledAt,
      endsAt: new Date(w.scheduledAt.getTime() + 60 * 60 * 1000),
    })),
  ];
}

function pushSlicedWindow(
  slots: OpenSlot[],
  busy: BusyRange[],
  timezone: string,
  from: Date,
  horizon: Date,
  durationMins: number,
  bufferMins: number,
  windowStart: Date,
  windowEnd: Date
) {
  const startParts = zonedParts(windowStart, timezone);
  let cursorMin = startParts.hour * 60 + startParts.minute;
  const endParts = zonedParts(windowEnd, timezone);
  const endMin = endParts.hour * 60 + endParts.minute + (endParts.day !== startParts.day ? 24 * 60 : 0);

  for (; cursorMin + durationMins <= endMin; cursorMin += durationMins + bufferMins) {
    const startH = Math.floor(cursorMin / 60);
    const startM = cursorMin % 60;
    const endsMin = cursorMin + durationMins;
    const startsAt = localWallTimeToUtc(
      timezone,
      startParts.year,
      startParts.month,
      startParts.day,
      startH,
      startM
    );
    const endsAt = localWallTimeToUtc(
      timezone,
      startParts.year,
      startParts.month,
      startParts.day,
      Math.floor(endsMin / 60),
      endsMin % 60
    );

    if (startsAt <= from || startsAt >= horizon) continue;
    if (busy.some((b) => rangesOverlap(startsAt, endsAt, b.startsAt, b.endsAt))) continue;

    slots.push({
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      label: `${minutesToLabel(cursorMin % (24 * 60))} – ${minutesToLabel(endsMin % (24 * 60) || 24 * 60)}`,
    });
  }
}

/** Generate open UTC slots from weekly hours + extra open slots, minus hub calendar busy. */
export async function listOpenSlotsForPage(
  page: PageForSlots & { id: string; hostUserId: string },
  from: Date = new Date(),
  durationMins = page.durationMins,
  opts?: BusyRangeOpts
): Promise<OpenSlot[]> {
  const horizon = new Date(from.getTime() + page.aheadDays * 24 * 60 * 60 * 1000);
  const busy = await listHostBusyRanges(page.hostUserId, from, horizon, opts);
  const slots: OpenSlot[] = [];
  const cursorParts = zonedParts(from, page.timezone);
  const overrideByDate = new Map(
    (page.dateOverrides ?? []).map((o) => [o.localDate, o] as const)
  );

  for (let dayOffset = 0; dayOffset <= page.aheadDays; dayOffset++) {
    const probe = localWallTimeToUtc(
      page.timezone,
      cursorParts.year,
      cursorParts.month,
      cursorParts.day + dayOffset,
      12,
      0
    );
    const day = zonedParts(probe, page.timezone);
    const dateKey = localDateKey(day.year, day.month, day.day);
    const override = overrideByDate.get(dateKey);
    if (override?.kind === "CLOSED") continue;

    const windows =
      override?.kind === "CUSTOM"
        ? override.windows
        : page.weeklyWindows.filter((w) => w.dayOfWeek === day.dayOfWeek);

    for (const win of windows) {
      const windowStart = localWallTimeToUtc(
        page.timezone,
        day.year,
        day.month,
        day.day,
        Math.floor(win.startMinute / 60),
        win.startMinute % 60
      );
      const windowEnd = localWallTimeToUtc(
        page.timezone,
        day.year,
        day.month,
        day.day,
        Math.floor(win.endMinute / 60),
        win.endMinute % 60
      );
      pushSlicedWindow(
        slots,
        busy,
        page.timezone,
        from,
        horizon,
        durationMins,
        page.bufferMins,
        windowStart,
        windowEnd
      );
    }
  }

  for (const extra of page.openSlots ?? []) {
    if (extra.endsAt <= from || extra.startsAt >= horizon) continue;
    const extraDay = zonedParts(extra.startsAt, page.timezone);
    const extraKey = localDateKey(extraDay.year, extraDay.month, extraDay.day);
    const extraOverride = overrideByDate.get(extraKey);
    // A date override replaces that day's hours entirely — skip additive extras.
    if (extraOverride) continue;
    pushSlicedWindow(
      slots,
      busy,
      page.timezone,
      from,
      horizon,
      durationMins,
      page.bufferMins,
      extra.startsAt,
      extra.endsAt
    );
  }

  const seen = new Set<string>();
  return slots
    .filter((s) => {
      if (seen.has(s.startsAt)) return false;
      seen.add(s.startsAt);
      return true;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getActiveBookingPageBySlug(slug: string) {
  return prisma.bookingPage.findFirst({
    where: { slug, isActive: true },
    include: {
      weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
      meetingTypes: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      openSlots: { orderBy: { startsAt: "asc" } },
      dateOverrides: {
        orderBy: { localDate: "asc" },
        include: { windows: { orderBy: { startMinute: "asc" } } },
      },
      host: { select: { id: true, name: true, email: true } },
    },
  });
}

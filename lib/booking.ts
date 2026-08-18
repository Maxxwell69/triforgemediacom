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

type PageForSlots = {
  timezone: string;
  durationMins: number;
  bufferMins: number;
  aheadDays: number;
  weeklyWindows: { dayOfWeek: number; startMinute: number; endMinute: number }[];
};

/** Generate open UTC slots from weekly windows, minus existing appointments. */
export async function listOpenSlotsForPage(
  page: PageForSlots & { id: string; hostUserId: string },
  from: Date = new Date()
): Promise<OpenSlot[]> {
  if (page.weeklyWindows.length === 0) return [];

  const horizon = new Date(from.getTime() + page.aheadDays * 24 * 60 * 60 * 1000);
  const busy = await prisma.appointment.findMany({
    where: {
      hostUserId: page.hostUserId,
      status: "CONFIRMED",
      startsAt: { lt: horizon },
      endsAt: { gt: from },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots: OpenSlot[] = [];
  const cursorParts = zonedParts(from, page.timezone);

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
    const windows = page.weeklyWindows.filter((w) => w.dayOfWeek === day.dayOfWeek);

    for (const win of windows) {
      for (
        let startMin = win.startMinute;
        startMin + page.durationMins <= win.endMinute;
        startMin += page.durationMins + page.bufferMins
      ) {
        const startH = Math.floor(startMin / 60);
        const startM = startMin % 60;
        const endsMin = startMin + page.durationMins;
        const endH = Math.floor(endsMin / 60);
        const endM = endsMin % 60;

        const startsAt = localWallTimeToUtc(
          page.timezone,
          day.year,
          day.month,
          day.day,
          startH,
          startM
        );
        const endsAt = localWallTimeToUtc(
          page.timezone,
          day.year,
          day.month,
          day.day,
          endH,
          endM
        );

        if (startsAt <= from) continue;
        if (startsAt >= horizon) continue;

        const overlaps = busy.some(
          (b) => startsAt < b.endsAt && endsAt > b.startsAt
        );
        if (overlaps) continue;

        slots.push({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          label: `${minutesToLabel(startMin)} – ${minutesToLabel(endsMin)}`,
        });
      }
    }
  }

  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getActiveBookingPageBySlug(slug: string) {
  return prisma.bookingPage.findFirst({
    where: { slug, isActive: true },
    include: {
      weeklyWindows: { orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }] },
      host: { select: { id: true, name: true, email: true } },
    },
  });
}

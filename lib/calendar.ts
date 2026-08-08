import "server-only";

import type {
  CalendarEventVisibility,
  UserRole,
  Webinar,
  WebinarAudience,
  WebinarStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getUserGroupIds } from "@/lib/groups";

/** Mass-audience webinars mirror onto the hub calendar. Admin-only stays off it. */
export function webinarShouldAppearOnCalendar(audience: WebinarAudience): boolean {
  return audience === "ALL" || audience === "CN" || audience === "MN";
}

export function webinarIsCalendarReady(status: WebinarStatus): boolean {
  return status === "SCHEDULED" || status === "LIVE";
}

type WebinarCalendarSource = Pick<
  Webinar,
  "id" | "title" | "description" | "scheduledAt" | "status" | "audience" | "hostUserId"
>;

/**
 * Upsert or remove the CalendarEvent mirror for a webinar.
 * Call after create/update; delete cascades via webinarId FK on webinar delete.
 */
export async function syncCalendarEventForWebinar(webinar: WebinarCalendarSource) {
  const existing = await prisma.calendarEvent.findUnique({
    where: { webinarId: webinar.id },
    select: { id: true },
  });

  const shouldShow =
    webinarShouldAppearOnCalendar(webinar.audience) && webinarIsCalendarReady(webinar.status);

  if (!shouldShow) {
    if (existing) {
      await prisma.calendarEvent.delete({ where: { id: existing.id } });
    }
    return null;
  }

  const endsAt = new Date(webinar.scheduledAt.getTime() + 60 * 60 * 1000);

  return prisma.calendarEvent.upsert({
    where: { webinarId: webinar.id },
    create: {
      title: webinar.title,
      description: webinar.description,
      kind: "WEBINAR",
      visibility: "HUB",
      startsAt: webinar.scheduledAt,
      endsAt,
      createdById: webinar.hostUserId,
      webinarId: webinar.id,
    },
    update: {
      title: webinar.title,
      description: webinar.description,
      startsAt: webinar.scheduledAt,
      endsAt,
      kind: "WEBINAR",
      visibility: "HUB",
    },
  });
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function defaultCalendarWindow(days = 42) {
  const from = startOfDay(new Date());
  const to = addDays(from, days);
  return { from, to };
}

export function canViewEvent(
  event: {
    visibility: CalendarEventVisibility;
    createdById: string;
    groupId: string | null;
    attendees: { userId: string }[];
  },
  userId: string,
  userRole: UserRole,
  userGroupIds: string[]
): boolean {
  if (isAdminRole(userRole)) return true;
  if (event.createdById === userId) return true;
  if (event.attendees.some((a) => a.userId === userId)) return true;

  if (event.visibility === "HUB") return true;
  if (event.visibility === "GROUP") {
    return Boolean(event.groupId && userGroupIds.includes(event.groupId));
  }
  return false;
}

export async function listVisibleCalendarEvents(
  userId: string,
  userRole: UserRole,
  from: Date,
  to: Date
) {
  const userGroupIds = await getUserGroupIds(userId);
  const events = await prisma.calendarEvent.findMany({
    where: {
      startsAt: { gte: from, lt: to },
    },
    orderBy: { startsAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      webinar: { select: { id: true, status: true, audience: true } },
      group: { select: { id: true, name: true, color: true } },
      attendees: { select: { userId: true } },
      _count: { select: { bookings: true } },
    },
  });

  return events.filter((e) => canViewEvent(e, userId, userRole, userGroupIds));
}

/** Open FREE availability windows others can book. */
export async function listBookableAvailability(from: Date, to: Date, excludeUserId?: string) {
  return prisma.availabilitySlot.findMany({
    where: {
      kind: "FREE",
      isBookable: true,
      startsAt: { gte: from, lt: to },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      bookings: {
        none: { status: { in: ["PENDING", "CONFIRMED"] } },
      },
    },
    orderBy: { startsAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listLiveAvailability(from: Date, to: Date) {
  return prisma.availabilitySlot.findMany({
    where: {
      kind: "LIVE",
      startsAt: { gte: from, lt: to },
    },
    orderBy: { startsAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

/** @deprecated use listVisibleCalendarEvents */
export async function listHubCalendarEvents(from: Date, to: Date) {
  return prisma.calendarEvent.findMany({
    where: {
      visibility: "HUB",
      startsAt: { gte: from, lt: to },
    },
    orderBy: { startsAt: "asc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      webinar: { select: { id: true, status: true, audience: true } },
    },
  });
}

export function formatCalendarWhen(startsAt: Date, endsAt: Date | null) {
  const start = startsAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  if (!endsAt) return start;
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  const end = endsAt.toLocaleString([], {
    dateStyle: sameDay ? undefined : "medium",
    timeStyle: "short",
  });
  return `${start} → ${end}`;
}

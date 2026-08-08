import "server-only";

import type { Webinar, WebinarAudience, WebinarStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

/** Placeholder range query for the member calendar UI (Phase D fills filters). */
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

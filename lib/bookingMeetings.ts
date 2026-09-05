import "server-only";

import { prisma } from "@/lib/prisma";
import { webinarGuestRoomUrl } from "@/lib/webinarExternal";
import { appointmentEmailPayload } from "@/lib/bookingReminders";
import type { AppointmentEmailData } from "@/lib/email";

export const appointmentManageInclude = {
  host: { select: { name: true, email: true } },
  bookingPage: {
    select: {
      id: true,
      title: true,
      timezone: true,
      durationMins: true,
      bufferMins: true,
      aheadDays: true,
      hostUserId: true,
      weeklyWindows: true,
      openSlots: true,
      dateOverrides: { include: { windows: true } },
    },
  },
  meetingType: { select: { title: true, durationMins: true } },
  webinar: {
    select: {
      id: true,
      status: true,
      externalInviteToken: true,
      externalGuests: { select: { joinToken: true }, take: 1 },
    },
  },
};

export type ManagedAppointment = {
  id: string;
  hostUserId: string;
  bookerName: string;
  bookerEmail: string;
  notes: string | null;
  startsAt: Date;
  endsAt: Date;
  status: "CONFIRMED" | "CANCELLED";
  webinarId: string | null;
  cancelToken: string;
  remindHourBefore: boolean;
  reminderSentAt: Date | null;
  host: { name: string | null; email: string };
  bookingPage: { title: string; timezone: string };
  meetingType: { title: string; durationMins: number } | null;
  webinar: {
    id: string;
    externalInviteToken: string | null;
    externalGuests: { joinToken: string }[];
  } | null;
};

export function appointmentMeetingTitle(apt: {
  meetingType?: { title: string } | null;
  bookingPage: { title: string };
}) {
  return apt.meetingType?.title || apt.bookingPage.title;
}

export function appointmentDurationMins(apt: {
  startsAt: Date;
  endsAt: Date;
  meetingType?: { durationMins: number } | null;
  bookingPage: { durationMins?: number };
}) {
  const fromTimes = Math.round((apt.endsAt.getTime() - apt.startsAt.getTime()) / 60000);
  if (fromTimes > 0) return fromTimes;
  return apt.meetingType?.durationMins ?? apt.bookingPage.durationMins ?? 30;
}

export function appointmentRoomUrls(apt: {
  webinar?: {
    id: string;
    externalInviteToken: string | null;
    externalGuests: { joinToken: string }[];
  } | null;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const invite = apt.webinar?.externalInviteToken;
  const join = apt.webinar?.externalGuests[0]?.joinToken;
  const webinarId = apt.webinar?.id;
  return {
    guestJoinUrl: invite && join ? webinarGuestRoomUrl(invite, join) : appUrl,
    hostWebinarUrl: webinarId ? `${appUrl}/webinars/${webinarId}/room` : appUrl,
  };
}

export function managedAppointmentEmailPayload(
  apt: ManagedAppointment
): AppointmentEmailData {
  const rooms = appointmentRoomUrls(apt);
  return appointmentEmailPayload({
    bookerName: apt.bookerName,
    bookerEmail: apt.bookerEmail,
    hostName: apt.host.name,
    hostEmail: apt.host.email,
    title: appointmentMeetingTitle(apt),
    startsAt: apt.startsAt,
    timezone: apt.bookingPage.timezone,
    guestJoinUrl: rooms.guestJoinUrl,
    hostWebinarUrl: rooms.hostWebinarUrl,
    cancelToken: apt.cancelToken,
    notes: apt.notes,
  });
}

export async function markAppointmentCancelled(appointment: {
  id: string;
  webinarId: string | null;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
    });
    if (appointment.webinarId) {
      await tx.calendarEvent.deleteMany({ where: { webinarId: appointment.webinarId } });
      await tx.webinar.update({
        where: { id: appointment.webinarId },
        data: { status: "ENDED", endedAt: new Date() },
      });
    }
  });
}

export function meetingStillActionable(startsAt: Date) {
  return startsAt.getTime() >= Date.now() - 30 * 60 * 1000;
}

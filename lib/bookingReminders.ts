import "server-only";

import { prisma } from "@/lib/prisma";
import { appointmentCancelUrl } from "@/lib/booking";
import { webinarGuestRoomUrl } from "@/lib/webinarExternal";
import {
  sendAppointmentReminderEmails,
  type AppointmentEmailData,
} from "@/lib/email";

const HOUR_MS = 60 * 60 * 1000;

function publicHostDisplayName(host: { name: string | null; email: string }): string {
  const name = host.name?.trim();
  return name || "TriForge host";
}

export function appointmentWhenLabel(startsAt: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(startsAt);
}

export function appointmentEmailPayload(input: {
  bookerName: string;
  bookerEmail: string;
  hostName: string | null;
  hostEmail: string;
  title: string;
  startsAt: Date;
  timezone: string;
  guestJoinUrl: string;
  hostWebinarUrl: string;
  cancelToken: string;
  notes?: string | null;
  reminderOffered?: boolean;
}): AppointmentEmailData {
  return {
    bookerName: input.bookerName,
    bookerEmail: input.bookerEmail,
    hostName: publicHostDisplayName({ name: input.hostName, email: input.hostEmail }),
    hostEmail: input.hostEmail,
    title: input.title,
    whenLabel: appointmentWhenLabel(input.startsAt, input.timezone),
    timezone: input.timezone,
    guestJoinUrl: input.guestJoinUrl,
    hostWebinarUrl: input.hostWebinarUrl,
    cancelUrl: appointmentCancelUrl(input.cancelToken),
    notes: input.notes,
    reminderOffered: input.reminderOffered,
  };
}

export async function sendDueAppointmentReminders() {
  const now = Date.now();
  const windowStart = new Date(now + 50 * 60 * 1000);
  const windowEnd = new Date(now + 75 * 60 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      remindHourBefore: true,
      reminderSentAt: null,
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    include: {
      host: { select: { name: true, email: true } },
      bookingPage: { select: { timezone: true, title: true } },
      meetingType: { select: { title: true } },
      webinar: {
        select: {
          id: true,
          externalInviteToken: true,
          externalGuests: { select: { joinToken: true }, take: 1 },
        },
      },
    },
    take: 50,
  });

  let sent = 0;
  let skipped = 0;

  for (const apt of due) {
    const claimed = await prisma.appointment.updateMany({
      where: { id: apt.id, reminderSentAt: null, status: "CONFIRMED" },
      data: { reminderSentAt: new Date() },
    });
    if (claimed.count !== 1) {
      skipped += 1;
      continue;
    }

    const invite = apt.webinar?.externalInviteToken;
    const join = apt.webinar?.externalGuests[0]?.joinToken;
    const webinarId = apt.webinar?.id;
    if (!invite || !join || !webinarId) {
      skipped += 1;
      continue;
    }

    const title = apt.meetingType?.title || apt.bookingPage.title;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      await sendAppointmentReminderEmails(
        appointmentEmailPayload({
          bookerName: apt.bookerName,
          bookerEmail: apt.bookerEmail,
          hostName: apt.host.name,
          hostEmail: apt.host.email,
          title,
          startsAt: apt.startsAt,
          timezone: apt.bookingPage.timezone,
          guestJoinUrl: webinarGuestRoomUrl(invite, join),
          hostWebinarUrl: `${appUrl}/webinars/${webinarId}/room`,
          cancelToken: apt.cancelToken,
        }),
        apt.id
      );
      sent += 1;
    } catch (err) {
      console.error("appointment reminder failed", apt.id, err);
      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminderSentAt: null },
      });
    }
  }

  return { due: due.length, sent, skipped, windowStart, windowEnd, hourMs: HOUR_MS };
}

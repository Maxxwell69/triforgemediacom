"use server";

import { prisma } from "@/lib/prisma";
import {
  managedAppointmentEmailPayload,
  markAppointmentCancelled,
  meetingStillActionable,
} from "@/lib/bookingMeetings";
import { sendAppointmentCancelledEmails } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

export async function cancelAppointmentByToken(
  token: string
): Promise<{ error: string | null; already?: boolean }> {
  const limit = checkRateLimit(`book-cancel:${token.slice(0, 16)}`, 8, 60 * 60 * 1000);
  if (limit.limited) {
    return { error: "Too many cancel attempts. Try again shortly." };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: {
      host: { select: { name: true, email: true } },
      bookingPage: { select: { timezone: true, title: true } },
      meetingType: { select: { title: true, durationMins: true } },
      webinar: {
        select: {
          id: true,
          externalInviteToken: true,
          externalGuests: { select: { joinToken: true }, take: 1 },
        },
      },
    },
  });
  if (!appointment) return { error: "This cancel link is invalid." };
  if (appointment.status === "CANCELLED") return { error: null, already: true };
  if (!meetingStillActionable(appointment.startsAt)) {
    return { error: "This meeting has already started or passed." };
  }

  await markAppointmentCancelled(appointment);

  try {
    await sendAppointmentCancelledEmails(managedAppointmentEmailPayload(appointment), appointment.id);
  } catch (err) {
    console.error("appointment cancel email failed", appointment.id, err);
  }

  return { error: null };
}

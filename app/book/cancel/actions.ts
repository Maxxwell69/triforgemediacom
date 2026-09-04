"use server";

import { prisma } from "@/lib/prisma";
import { webinarGuestRoomUrl } from "@/lib/webinarExternal";
import { appointmentEmailPayload } from "@/lib/bookingReminders";
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
      meetingType: { select: { title: true } },
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
  if (appointment.startsAt.getTime() < Date.now() - 30 * 60 * 1000) {
    return { error: "This meeting has already started or passed." };
  }

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

  const invite = appointment.webinar?.externalInviteToken;
  const join = appointment.webinar?.externalGuests[0]?.joinToken;
  const webinarId = appointment.webinar?.id;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    await sendAppointmentCancelledEmails(
      appointmentEmailPayload({
        bookerName: appointment.bookerName,
        bookerEmail: appointment.bookerEmail,
        hostName: appointment.host.name,
        hostEmail: appointment.host.email,
        title: appointment.meetingType?.title || appointment.bookingPage.title,
        startsAt: appointment.startsAt,
        timezone: appointment.bookingPage.timezone,
        guestJoinUrl:
          invite && join ? webinarGuestRoomUrl(invite, join) : appUrl,
        hostWebinarUrl: webinarId ? `${appUrl}/webinars/${webinarId}/room` : appUrl,
        cancelToken: appointment.cancelToken,
      }),
      appointment.id
    );
  } catch (err) {
    console.error("appointment cancel email failed", appointment.id, err);
  }

  return { error: null };
}

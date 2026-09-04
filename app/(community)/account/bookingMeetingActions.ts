"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { listHostBusyRanges, listOpenSlotsForPage } from "@/lib/booking";
import {
  appointmentDurationMins,
  appointmentManageInclude,
  appointmentRoomUrls,
  managedAppointmentEmailPayload,
  markAppointmentCancelled,
  meetingStillActionable,
} from "@/lib/bookingMeetings";
import {
  sendAppointmentCancelledEmails,
  sendAppointmentManualReminderEmails,
  sendAppointmentRescheduledEmails,
} from "@/lib/email";
import { appointmentEmailPayload } from "@/lib/bookingReminders";
import { checkRateLimit } from "@/lib/rateLimit";

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true, email: true, name: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return dbUser;
}

async function loadHostAppointment(appointmentId: string, hostUserId: string) {
  return prisma.appointment.findFirst({
    where: { id: appointmentId, hostUserId },
    include: appointmentManageInclude,
  });
}

function revalidateMeetings() {
  revalidatePath("/account/booking");
  revalidatePath("/account/booking/meetings");
}

export async function cancelHostAppointment(
  appointmentId: string
): Promise<{ error: string | null; already?: boolean }> {
  const user = await requireStaff();
  const limit = checkRateLimit(`host-cancel:${user.id}`, 20, 60 * 60 * 1000);
  if (limit.limited) return { error: "Too many cancel attempts. Try again shortly." };

  const appointment = await loadHostAppointment(appointmentId, user.id);
  if (!appointment) return { error: "Meeting not found." };
  if (appointment.status === "CANCELLED") return { error: null, already: true };
  if (!meetingStillActionable(appointment.startsAt)) {
    return { error: "This meeting has already started or passed." };
  }

  await markAppointmentCancelled(appointment);
  try {
    await sendAppointmentCancelledEmails(
      managedAppointmentEmailPayload(appointment),
      appointment.id
    );
  } catch (err) {
    console.error("host appointment cancel email failed", appointment.id, err);
  }

  revalidateMeetings();
  revalidatePath(`/account/booking/meetings/${appointment.id}`);
  return { error: null };
}

export async function sendHostAppointmentReminder(
  appointmentId: string
): Promise<{ error: string | null }> {
  const user = await requireStaff();
  const limit = checkRateLimit(`host-remind:${appointmentId}`, 3, 60 * 60 * 1000);
  if (limit.limited) {
    return { error: "You already sent a reminder recently. Try again in a bit." };
  }

  const appointment = await loadHostAppointment(appointmentId, user.id);
  if (!appointment) return { error: "Meeting not found." };
  if (appointment.status !== "CONFIRMED") return { error: "That meeting is no longer active." };
  if (appointment.startsAt.getTime() <= Date.now()) {
    return { error: "This meeting has already started." };
  }
  if (!appointment.webinar?.externalInviteToken || !appointment.webinar.externalGuests[0]?.joinToken) {
    return { error: "This meeting is missing a room link, so a reminder can't be sent." };
  }

  const stamp = Date.now();
  try {
    await sendAppointmentManualReminderEmails(
      managedAppointmentEmailPayload(appointment),
      `${appointment.id}/${stamp}`
    );
  } catch (err) {
    console.error("host appointment reminder failed", appointment.id, err);
    return { error: "Couldn't send that reminder. Try again." };
  }

  return { error: null };
}

export async function rescheduleHostAppointment(
  appointmentId: string,
  startsAtIso: string
): Promise<{ error: string | null }> {
  const user = await requireStaff();
  const limit = checkRateLimit(`host-reschedule:${user.id}`, 12, 60 * 60 * 1000);
  if (limit.limited) return { error: "Too many reschedule attempts. Try again shortly." };

  const appointment = await loadHostAppointment(appointmentId, user.id);
  if (!appointment) return { error: "Meeting not found." };
  if (appointment.status !== "CONFIRMED") return { error: "That meeting is no longer active." };
  if (appointment.startsAt.getTime() <= Date.now()) {
    return { error: "This meeting has already started." };
  }

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { error: "Invalid start time." };
  if (startsAt.getTime() === appointment.startsAt.getTime()) {
    return { error: "Pick a different time." };
  }
  if (startsAt.getTime() <= Date.now()) return { error: "That time has already passed." };

  const durationMins = appointmentDurationMins({
    ...appointment,
    bookingPage: { durationMins: appointment.bookingPage.durationMins },
  });
  const endsAt = new Date(startsAt.getTime() + durationMins * 60 * 1000);
  const exclude = {
    excludeAppointmentId: appointment.id,
    excludeWebinarId: appointment.webinarId ?? undefined,
  };

  const open = await listOpenSlotsForPage(appointment.bookingPage, new Date(), durationMins, exclude);
  if (!open.some((s) => s.startsAt === startsAt.toISOString())) {
    return { error: "That time is no longer available. Pick another slot." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${appointment.hostUserId}`}))`;

        const busy = await listHostBusyRanges(appointment.hostUserId, startsAt, endsAt, exclude);
        if (busy.some((b) => startsAt < b.endsAt && endsAt > b.startsAt)) {
          throw new Error("SLOT_TAKEN");
        }

        const resetReminder = startsAt.getTime() - Date.now() > 75 * 60 * 1000;
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            startsAt,
            endsAt,
            ...(resetReminder ? { reminderSentAt: null } : {}),
          },
        });
        if (appointment.webinarId) {
          await tx.webinar.update({
            where: { id: appointment.webinarId },
            data: { scheduledAt: startsAt },
          });
          await tx.calendarEvent.updateMany({
            where: { webinarId: appointment.webinarId },
            data: { startsAt, endsAt },
          });
        }
      },
      { timeout: 15000 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return { error: "That time was just taken. Please choose another." };
    }
    console.error("host appointment reschedule failed", appointment.id, err);
    return { error: "Couldn't reschedule that meeting. Try again." };
  }

  const rooms = appointmentRoomUrls(appointment);

  try {
    await sendAppointmentRescheduledEmails(
      appointmentEmailPayload({
        bookerName: appointment.bookerName,
        bookerEmail: appointment.bookerEmail,
        hostName: appointment.host.name,
        hostEmail: appointment.host.email,
        title: appointment.meetingType?.title || appointment.bookingPage.title,
        startsAt,
        timezone: appointment.bookingPage.timezone,
        guestJoinUrl: rooms.guestJoinUrl,
        hostWebinarUrl: rooms.hostWebinarUrl,
        cancelToken: appointment.cancelToken,
        notes: appointment.notes,
      }),
      `${appointment.id}/${startsAt.toISOString()}`
    );
  } catch (err) {
    console.error("host appointment reschedule email failed", appointment.id, err);
  }

  revalidateMeetings();
  revalidatePath(`/account/booking/meetings/${appointment.id}`);
  return { error: null };
}

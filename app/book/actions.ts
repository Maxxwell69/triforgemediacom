"use server";

import { prisma } from "@/lib/prisma";
import {
  getActiveBookingPageBySlug,
  listOpenSlotsForPage,
} from "@/lib/booking";
import { publicBookSchema } from "@/lib/validations/booking";
import { webinarRoomName } from "@/lib/webinars";
import {
  generateWebinarExternalToken,
  webinarGuestAccessUrl,
} from "@/lib/webinarExternal";
import { sendAppointmentBookedEmails } from "@/lib/email";

export async function bookAppointment(
  slug: string,
  formData: FormData
): Promise<{ error: string | null; guestJoinUrl?: string }> {
  const parsed = publicBookSchema.safeParse({
    startsAt: formData.get("startsAt"),
    bookerName: formData.get("bookerName"),
    bookerEmail: formData.get("bookerEmail"),
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid booking" };
  }

  const page = await getActiveBookingPageBySlug(slug);
  if (!page) return { error: "This booking page is unavailable." };

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { error: "Invalid start time." };
  const endsAt = new Date(startsAt.getTime() + page.durationMins * 60 * 1000);

  const open = await listOpenSlotsForPage(page);
  const match = open.find((s) => s.startsAt === startsAt.toISOString());
  if (!match) {
    return { error: "That time is no longer available. Pick another slot." };
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      hostUserId: page.hostUserId,
      status: "CONFIRMED",
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (conflict) return { error: "That time was just taken. Please choose another." };

  const inviteToken = generateWebinarExternalToken();
  const joinToken = generateWebinarExternalToken();
  const title = `${page.title} with ${parsed.data.bookerName}`;

  const webinar = await prisma.webinar.create({
    data: {
      title,
      description: parsed.data.notes || `Appointment booked via /book/${page.slug}`,
      scheduledAt: startsAt,
      status: "SCHEDULED",
      audience: "ADMIN",
      hostUserId: page.hostUserId,
      livekitRoomName: `webinar_pending_${Date.now()}`,
      externalSignupEnabled: true,
      externalInviteToken: inviteToken,
    },
  });

  await prisma.webinar.update({
    where: { id: webinar.id },
    data: { livekitRoomName: webinarRoomName(webinar.id) },
  });

  await prisma.webinarGuest.create({
    data: {
      webinarId: webinar.id,
      name: parsed.data.bookerName,
      email: parsed.data.bookerEmail.toLowerCase(),
      joinToken,
      role: "SPEAKER",
    },
  });

  // Private staff calendar entry (not hub-wide).
  await prisma.calendarEvent.create({
    data: {
      title,
      description: `With ${parsed.data.bookerName} (${parsed.data.bookerEmail})`,
      kind: "MEETING",
      visibility: "PRIVATE",
      startsAt,
      endsAt,
      createdById: page.hostUserId,
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      bookingPageId: page.id,
      hostUserId: page.hostUserId,
      bookerName: parsed.data.bookerName,
      bookerEmail: parsed.data.bookerEmail.toLowerCase(),
      notes: parsed.data.notes || null,
      startsAt,
      endsAt,
      status: "CONFIRMED",
      webinarId: webinar.id,
    },
  });

  const whenLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: page.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(startsAt);

  const guestJoinUrl = webinarGuestAccessUrl(inviteToken, joinToken);
  const hostWebinarUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/webinars/${webinar.id}`;

  try {
    await sendAppointmentBookedEmails(
      {
        bookerName: parsed.data.bookerName,
        bookerEmail: parsed.data.bookerEmail.toLowerCase(),
        hostName: page.host.name || page.host.email,
        hostEmail: page.host.email,
        title: page.title,
        whenLabel,
        timezone: page.timezone,
        guestJoinUrl,
        hostWebinarUrl,
        notes: parsed.data.notes,
      },
      appointment.id
    );
  } catch (err) {
    console.error("Appointment email failed", appointment.id, err);
  }

  return { error: null, guestJoinUrl };
}

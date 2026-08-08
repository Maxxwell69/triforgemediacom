"use server";

import { headers } from "next/headers";
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
import { checkRateLimit } from "@/lib/rateLimit";

function clientIpFromHeaders(): string {
  const h = headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function publicHostDisplayName(host: { name: string | null; email: string }): string {
  const name = host.name?.trim();
  if (name) return name;
  // Never expose staff login email on the public booking surface.
  return "TriForge host";
}

export async function bookAppointment(
  slug: string,
  formData: FormData
): Promise<{ error: string | null; guestJoinUrl?: string }> {
  const ip = clientIpFromHeaders();
  const ipLimit = checkRateLimit(`book:ip:${ip}`, 12, 60 * 60 * 1000);
  if (ipLimit.limited) {
    return {
      error: `Too many booking attempts. Try again in about ${ipLimit.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = publicBookSchema.safeParse({
    startsAt: formData.get("startsAt"),
    bookerName: formData.get("bookerName"),
    bookerEmail: formData.get("bookerEmail"),
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid booking" };
  }

  const emailKey = parsed.data.bookerEmail.toLowerCase();
  const emailLimit = checkRateLimit(`book:email:${emailKey}`, 8, 60 * 60 * 1000);
  if (emailLimit.limited) {
    return {
      error: `Too many bookings from this email. Try again in about ${emailLimit.retryAfterSeconds} seconds.`,
    };
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

  const inviteToken = generateWebinarExternalToken();
  const joinToken = generateWebinarExternalToken();
  const title = `${page.title} with ${parsed.data.bookerName}`;
  const hostDisplay = publicHostDisplayName(page.host);

  let webinarId: string;
  let appointmentId: string;

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        // Serialize bookings per host so two concurrent requests can't both pass the conflict check.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${page.hostUserId}`}))`;

        const conflict = await tx.appointment.findFirst({
          where: {
            hostUserId: page.hostUserId,
            status: "CONFIRMED",
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
          select: { id: true },
        });
        if (conflict) {
          throw new Error("SLOT_TAKEN");
        }

        const webinar = await tx.webinar.create({
          data: {
            title,
            description: parsed.data.notes || `Appointment booked via /book/${page.slug}`,
            scheduledAt: startsAt,
            status: "SCHEDULED",
            audience: "ADMIN",
            hostUserId: page.hostUserId,
            livekitRoomName: `webinar_pending_${Date.now()}`,
            // Closed signup: only the pre-created guest joinToken can enter.
            externalSignupEnabled: false,
            externalInviteToken: inviteToken,
          },
        });

        await tx.webinar.update({
          where: { id: webinar.id },
          data: { livekitRoomName: webinarRoomName(webinar.id) },
        });

        await tx.webinarGuest.create({
          data: {
            webinarId: webinar.id,
            name: parsed.data.bookerName,
            email: emailKey,
            joinToken,
            role: "SPEAKER",
          },
        });

        // Private staff calendar entry (not hub-wide).
        await tx.calendarEvent.create({
          data: {
            title,
            description: `With ${parsed.data.bookerName} (${emailKey})`,
            kind: "MEETING",
            visibility: "PRIVATE",
            startsAt,
            endsAt,
            createdById: page.hostUserId,
          },
        });

        const appointment = await tx.appointment.create({
          data: {
            bookingPageId: page.id,
            hostUserId: page.hostUserId,
            bookerName: parsed.data.bookerName,
            bookerEmail: emailKey,
            notes: parsed.data.notes || null,
            startsAt,
            endsAt,
            status: "CONFIRMED",
            webinarId: webinar.id,
          },
        });

        return { webinarId: webinar.id, appointmentId: appointment.id };
      },
      { timeout: 15000 }
    );

    webinarId = created.webinarId;
    appointmentId = created.appointmentId;
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return { error: "That time was just taken. Please choose another." };
    }
    console.error("bookAppointment transaction failed:", err);
    return { error: "Couldn't complete that booking. Please try again." };
  }

  const whenLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: page.timezone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(startsAt);

  const guestJoinUrl = webinarGuestAccessUrl(inviteToken, joinToken);
  const hostWebinarUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/webinars/${webinarId}`;

  try {
    await sendAppointmentBookedEmails(
      {
        bookerName: parsed.data.bookerName,
        bookerEmail: emailKey,
        hostName: hostDisplay,
        hostEmail: page.host.email,
        title: page.title,
        whenLabel,
        timezone: page.timezone,
        guestJoinUrl,
        hostWebinarUrl,
        notes: parsed.data.notes,
      },
      appointmentId
    );
  } catch (err) {
    console.error("Appointment email failed", appointmentId, err);
  }

  return { error: null, guestJoinUrl };
}

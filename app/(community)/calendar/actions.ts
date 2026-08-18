"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { canViewEvent, listEventCreatableGroups } from "@/lib/calendar";
import { getUserGroupIds } from "@/lib/groups";
import {
  availabilitySlotSchema,
  bookingNotesSchema,
  calendarEventSchema,
  parseDateTime,
} from "@/lib/validations/calendar";
import { formTimeZone } from "@/lib/time";

async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authorized");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, status: true, role: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE") throw new Error("Not authorized");
  return dbUser;
}

function revalidateCalendar(eventId?: string) {
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
  if (eventId) revalidatePath(`/calendar/events/${eventId}`);
}

/** Members of groups with canCreateEvents (or hub admins) may schedule group events. */
export async function createGroupCalendarEvent(
  formData: FormData
): Promise<{ error: string | null; eventId?: string }> {
  const user = await requireActiveUser();
  const creatable = await listEventCreatableGroups(user.id, user.role);
  if (creatable.length === 0) {
    return { error: "Your groups aren’t allowed to create calendar events yet." };
  }

  const parsed = calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    kind: formData.get("kind") || "EVENT",
    visibility: "GROUP",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || "",
    location: formData.get("location") || "",
    groupId: formData.get("groupId") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid event" };
  }
  if (parsed.data.kind === "WEBINAR") {
    return { error: "Webinars are created under Admin → Webinars." };
  }

  const allowedIds = new Set(creatable.map((g) => g.id));
  if (!parsed.data.groupId || !allowedIds.has(parsed.data.groupId)) {
    return { error: "Pick a group you’re allowed to schedule for." };
  }

  let startsAt: Date;
  let endsAt: Date | null = null;
  try {
    const zone = formTimeZone(formData);
    startsAt = parseDateTime(parsed.data.startsAt, "start time", zone);
    endsAt = parsed.data.endsAt ? parseDateTime(parsed.data.endsAt, "end time", zone) : null;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid times" };
  }
  if (endsAt && endsAt <= startsAt) return { error: "End time must be after start time" };

  const event = await prisma.calendarEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind,
      visibility: "GROUP",
      startsAt,
      endsAt,
      location: parsed.data.location || null,
      groupId: parsed.data.groupId,
      createdById: user.id,
    },
    select: { id: true },
  });

  revalidateCalendar(event.id);
  return { error: null, eventId: event.id };
}

/** Staff availability — managed from Account for now (not the public calendar). */
export async function createAvailabilitySlot(
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) {
    return { error: "Only staff can manage availability right now." };
  }
  const parsed = availabilitySlotSchema.safeParse({
    kind: formData.get("kind") || "FREE",
    label: formData.get("label") || "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isBookable: formData.get("isBookable") === "on" ? "on" : "false",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid availability" };
  }

  let startsAt: Date;
  let endsAt: Date;
  try {
    const zone = formTimeZone(formData);
    startsAt = parseDateTime(parsed.data.startsAt, "start time", zone);
    endsAt = parseDateTime(parsed.data.endsAt, "end time", zone);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid times" };
  }
  if (endsAt <= startsAt) return { error: "End time must be after start time" };

  const kind = parsed.data.kind;
  const isBookable =
    kind === "FREE" ? parsed.data.isBookable !== "false" : false;

  await prisma.availabilitySlot.create({
    data: {
      userId: user.id,
      kind,
      label: parsed.data.label || null,
      startsAt,
      endsAt,
      isBookable,
    },
  });

  revalidateCalendar();
  return { error: null };
}

export async function deleteAvailabilitySlot(
  slotId: string
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  if (!isAdminRole(user.role)) {
    return { error: "Only staff can manage availability right now." };
  }
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) return { error: "Slot not found" };
  if (slot.userId !== user.id && !isAdminRole(user.role)) return { error: "Not authorized" };

  await prisma.availabilitySlot.delete({ where: { id: slotId } });
  revalidateCalendar();
  return { error: null };
}

export async function bookAvailabilitySlot(
  slotId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const notesParsed = bookingNotesSchema.safeParse({
    notes: formData.get("notes") || "",
  });
  if (!notesParsed.success) {
    return { error: notesParsed.error.issues[0]?.message || "Invalid notes" };
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: slotId },
  });
  if (!slot || !slot.isBookable || slot.kind !== "FREE") {
    return { error: "This slot is not available to book." };
  }
  if (slot.userId === user.id) {
    return { error: "You can't book your own availability." };
  }
  if (slot.startsAt.getTime() <= Date.now()) {
    return { error: "That slot has already started." };
  }

  const conflict = await prisma.calendarBooking.findFirst({
    where: {
      slotId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflict) return { error: "Someone already requested this slot." };

  await prisma.calendarBooking.create({
    data: {
      slotId,
      bookerId: user.id,
      hostId: slot.userId,
      status: "PENDING",
      notes: notesParsed.data.notes || null,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    },
  });

  revalidateCalendar();
  return { error: null };
}

/** RSVP / request a seat on a hub event. */
export async function rsvpCalendarEvent(
  eventId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const notesParsed = bookingNotesSchema.safeParse({
    notes: formData.get("notes") || "",
  });
  if (!notesParsed.success) {
    return { error: notesParsed.error.issues[0]?.message || "Invalid notes" };
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      createdById: true,
      webinarId: true,
      visibility: true,
      groupId: true,
      attendees: { select: { userId: true } },
    },
  });
  if (!event) return { error: "Event not found" };
  if (event.webinarId) {
    return { error: "Join webinars from the Webinars page." };
  }

  const userGroupIds = await getUserGroupIds(user.id);
  if (!canViewEvent(event, user.id, user.role, userGroupIds)) {
    return { error: "Event not found" };
  }
  // Private appointments are invite-only — don't let RSVP expand the attendee list.
  if (event.visibility === "PRIVATE") {
    return { error: "This event is invite-only." };
  }

  const existing = await prisma.calendarBooking.findFirst({
    where: {
      eventId,
      bookerId: user.id,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (existing) return { error: "You're already on this event." };

  const endsAt = event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.calendarEventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      update: {},
      create: { eventId, userId: user.id },
    }),
    prisma.calendarBooking.create({
      data: {
        eventId,
        bookerId: user.id,
        hostId: event.createdById,
        status: "CONFIRMED",
        notes: notesParsed.data.notes || null,
        startsAt: event.startsAt,
        endsAt,
      },
    }),
  ]);

  revalidateCalendar(eventId);
  return { error: null };
}

export async function respondToBooking(
  bookingId: string,
  status: "CONFIRMED" | "DECLINED" | "CANCELLED"
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const booking = await prisma.calendarBooking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) return { error: "Booking not found" };

  const isHost = booking.hostId === user.id;
  const isBooker = booking.bookerId === user.id;
  if (status === "CANCELLED") {
    if (!isHost && !isBooker) return { error: "Not authorized" };
  } else if (!isHost) {
    return { error: "Only the host can confirm or decline." };
  }

  await prisma.calendarBooking.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidateCalendar();
  return { error: null };
}

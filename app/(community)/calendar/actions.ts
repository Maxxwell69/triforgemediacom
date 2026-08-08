"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  availabilitySlotSchema,
  bookingNotesSchema,
  calendarEventSchema,
  parseDateTime,
} from "@/lib/validations/calendar";

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

function revalidateCalendar() {
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
}

/** Members post go-live / free / busy windows. */
export async function createAvailabilitySlot(
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
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
    startsAt = parseDateTime(parsed.data.startsAt, "start time");
    endsAt = parseDateTime(parsed.data.endsAt, "end time");
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
  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) return { error: "Slot not found" };
  if (slot.userId !== user.id) return { error: "Not authorized" };

  await prisma.availabilitySlot.delete({ where: { id: slotId } });
  revalidateCalendar();
  return { error: null };
}

/** Members create hub EVENT / LIVE special events. */
export async function createMemberCalendarEvent(
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireActiveUser();
  const kindRaw = String(formData.get("kind") || "EVENT");
  if (kindRaw !== "EVENT" && kindRaw !== "LIVE") {
    return { error: "Members can post Event or Live only." };
  }

  const parsed = calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    kind: kindRaw,
    visibility: "HUB",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || "",
    location: formData.get("location") || "",
    groupId: "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid event" };
  }

  let startsAt: Date;
  let endsAt: Date | null = null;
  try {
    startsAt = parseDateTime(parsed.data.startsAt, "start time");
    endsAt = parsed.data.endsAt ? parseDateTime(parsed.data.endsAt, "end time") : null;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid times" };
  }
  if (endsAt && endsAt <= startsAt) return { error: "End time must be after start time" };

  await prisma.calendarEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind,
      visibility: "HUB",
      startsAt,
      endsAt,
      location: parsed.data.location || null,
      createdById: user.id,
    },
  });

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
    },
  });
  if (!event) return { error: "Event not found" };
  if (event.webinarId) {
    return { error: "Join webinars from the Webinars page." };
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

  revalidateCalendar();
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

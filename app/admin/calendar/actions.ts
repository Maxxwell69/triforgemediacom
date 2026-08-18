"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { calendarEventSchema, parseDateTime } from "@/lib/validations/calendar";
import { formTimeZone } from "@/lib/time";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, id: dbUser.id, role: dbUser.role } };
}

function revalidateCalendar() {
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
}

export async function createAdminCalendarEvent(formData: FormData) {
  const session = await requireAdmin();
  const parsed = calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    kind: formData.get("kind") || "MEETING",
    visibility: formData.get("visibility") || "HUB",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || "",
    location: formData.get("location") || "",
    groupId: formData.get("groupId") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid event");
  }

  const zone = formTimeZone(formData);
  const startsAt = parseDateTime(parsed.data.startsAt, "start time", zone);
  const endsAt = parsed.data.endsAt ? parseDateTime(parsed.data.endsAt, "end time", zone) : null;
  if (endsAt && endsAt <= startsAt) throw new Error("End time must be after start time");

  const visibility = parsed.data.visibility ?? "HUB";
  if (visibility === "GROUP" && !parsed.data.groupId) {
    throw new Error("Group visibility requires a group");
  }

  // Admins don't create WEBINAR rows here — those come from Admin → Webinars sync.
  if (parsed.data.kind === "WEBINAR") {
    throw new Error("Create webinars under Admin → Webinars so they sync onto the calendar.");
  }

  await prisma.calendarEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind,
      visibility,
      startsAt,
      endsAt,
      location: parsed.data.location || null,
      groupId: parsed.data.groupId || null,
      createdById: session.user.id,
    },
  });

  revalidateCalendar();
}

export async function updateAdminCalendarEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const existing = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!existing) throw new Error("Event not found");
  if (existing.webinarId) {
    throw new Error("Edit webinars under Admin → Webinars.");
  }

  const parsed = calendarEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    kind: formData.get("kind") || existing.kind,
    visibility: formData.get("visibility") || existing.visibility,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || "",
    location: formData.get("location") || "",
    groupId: formData.get("groupId") || "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid event");
  }

  const zone = formTimeZone(formData);
  const startsAt = parseDateTime(parsed.data.startsAt, "start time", zone);
  const endsAt = parsed.data.endsAt ? parseDateTime(parsed.data.endsAt, "end time", zone) : null;
  if (endsAt && endsAt <= startsAt) throw new Error("End time must be after start time");

  const visibility = parsed.data.visibility ?? "HUB";
  if (visibility === "GROUP" && !parsed.data.groupId) {
    throw new Error("Group visibility requires a group");
  }

  await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      kind: parsed.data.kind === "WEBINAR" ? existing.kind : parsed.data.kind,
      visibility,
      startsAt,
      endsAt,
      location: parsed.data.location || null,
      groupId: parsed.data.groupId || null,
    },
  });

  revalidateCalendar();
}

export async function deleteAdminCalendarEvent(eventId: string) {
  await requireAdmin();
  const existing = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
  if (!existing) throw new Error("Event not found");
  if (existing.webinarId) {
    throw new Error("Remove webinars under Admin → Webinars.");
  }
  await prisma.calendarEvent.delete({ where: { id: eventId } });
  revalidateCalendar();
}

export async function setBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "DECLINED" | "CANCELLED"
) {
  await requireAdmin();
  await prisma.calendarBooking.update({
    where: { id: bookingId },
    data: { status },
  });
  revalidateCalendar();
}

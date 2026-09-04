"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { suggestBookingSlug } from "@/lib/booking";
import { parseZonedDateTime } from "@/lib/time";
import {
  bookingMeetingTypeSchema,
  bookingOpenSlotSchema,
  bookingPageSettingsSchema,
  weeklyWindowSchema,
} from "@/lib/validations/booking";
import { z } from "zod";

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

export async function ensureBookingPage() {
  const user = await requireStaff();
  const existing = await prisma.bookingPage.findUnique({ where: { hostUserId: user.id } });
  if (existing) {
    const typeCount = await prisma.bookingMeetingType.count({
      where: { bookingPageId: existing.id },
    });
    if (typeCount === 0) {
      await prisma.bookingMeetingType.create({
        data: {
          bookingPageId: existing.id,
          title: "Meeting",
          durationMins: existing.durationMins,
        },
      });
    }
    return existing.id;
  }

  let slug = suggestBookingSlug(user.email, user.name);
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.bookingPage.findUnique({ where: { slug } });
    if (!clash) break;
    slug = suggestBookingSlug(user.email, user.name);
  }

  const page = await prisma.bookingPage.create({
    data: {
      hostUserId: user.id,
      slug,
      title: "Book a meeting",
      timezone: "America/New_York",
      durationMins: 30,
      // Default weekdays 9–5
      weeklyWindows: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        })),
      },
      meetingTypes: {
        create: {
          title: "Meeting",
          durationMins: 30,
          sortOrder: 0,
        },
      },
    },
  });
  revalidatePath("/account");
  revalidatePath("/account/booking");
  return page.id;
}

export async function updateBookingPageSettings(
  formData: FormData
): Promise<{ error: string | null }> {
  const user = await requireStaff();
  await ensureBookingPage();

  const parsed = bookingPageSettingsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
    durationMins: formData.get("durationMins"),
    bufferMins: formData.get("bufferMins"),
    aheadDays: formData.get("aheadDays"),
    isActive: formData.get("isActive") === "on",
    remindHourBefore: formData.get("remindHourBefore") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid settings" };
  }

  const clash = await prisma.bookingPage.findFirst({
    where: { slug: parsed.data.slug, hostUserId: { not: user.id } },
    select: { id: true },
  });
  if (clash) return { error: "That booking link is already taken." };

  await prisma.bookingPage.update({
    where: { hostUserId: user.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      slug: parsed.data.slug,
      timezone: parsed.data.timezone,
      durationMins: parsed.data.durationMins,
      bufferMins: parsed.data.bufferMins,
      aheadDays: parsed.data.aheadDays,
      isActive: parsed.data.isActive ?? true,
      remindHourBefore: parsed.data.remindHourBefore ?? true,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/booking");
  revalidatePath(`/book/${parsed.data.slug}`);
  return { error: null };
}

export async function setBookingWeeklyWindows(
  windowsJson: string
): Promise<{ error: string | null }> {
  const user = await requireStaff();
  await ensureBookingPage();

  let raw: unknown;
  try {
    raw = JSON.parse(windowsJson);
  } catch {
    return { error: "Invalid schedule payload" };
  }

  const parsed = z.array(weeklyWindowSchema).safeParse(raw);
  if (!parsed.success) return { error: "Invalid weekly windows" };

  for (const w of parsed.data) {
    if (w.endMinute <= w.startMinute) {
      return { error: "Each window needs an end time after its start." };
    }
  }

  const page = await prisma.bookingPage.findUnique({
    where: { hostUserId: user.id },
    select: { id: true, slug: true },
  });
  if (!page) return { error: "Booking page not found" };

  await prisma.$transaction([
    prisma.bookingWeeklyWindow.deleteMany({ where: { bookingPageId: page.id } }),
    prisma.bookingWeeklyWindow.createMany({
      data: parsed.data.map((w) => ({
        bookingPageId: page.id,
        dayOfWeek: w.dayOfWeek,
        startMinute: w.startMinute,
        endMinute: w.endMinute,
      })),
    }),
  ]);

  revalidatePath("/account");
  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

async function hostBookingPage() {
  const user = await requireStaff();
  await ensureBookingPage();
  const page = await prisma.bookingPage.findUnique({
    where: { hostUserId: user.id },
    select: { id: true, slug: true, timezone: true },
  });
  if (!page) throw new Error("Booking page not found");
  return page;
}

export async function createBookingMeetingType(
  formData: FormData
): Promise<{ error: string | null }> {
  const page = await hostBookingPage();
  const parsed = bookingMeetingTypeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    durationMins: formData.get("durationMins"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid meeting type" };
  }

  const maxOrder = await prisma.bookingMeetingType.aggregate({
    where: { bookingPageId: page.id },
    _max: { sortOrder: true },
  });

  await prisma.bookingMeetingType.create({
    data: {
      bookingPageId: page.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      durationMins: parsed.data.durationMins,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

export async function updateBookingMeetingType(
  typeId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  const page = await hostBookingPage();
  const parsed = bookingMeetingTypeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    durationMins: formData.get("durationMins"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid meeting type" };
  }

  const existing = await prisma.bookingMeetingType.findFirst({
    where: { id: typeId, bookingPageId: page.id },
    select: { id: true },
  });
  if (!existing) return { error: "Meeting type not found" };

  await prisma.bookingMeetingType.update({
    where: { id: typeId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      durationMins: parsed.data.durationMins,
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

export async function deleteBookingMeetingType(
  typeId: string
): Promise<{ error: string | null }> {
  const page = await hostBookingPage();
  const existing = await prisma.bookingMeetingType.findFirst({
    where: { id: typeId, bookingPageId: page.id },
    select: { id: true },
  });
  if (!existing) return { error: "Meeting type not found" };
  await prisma.bookingMeetingType.delete({ where: { id: typeId } });
  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

export async function addBookingOpenSlot(
  formData: FormData
): Promise<{ error: string | null }> {
  const page = await hostBookingPage();
  const parsed = bookingOpenSlotSchema.safeParse({
    date: formData.get("date"),
    start: formData.get("start"),
    end: formData.get("end"),
    label: formData.get("label") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid open slot" };
  }

  const startsAt = parseZonedDateTime(
    `${parsed.data.date}T${parsed.data.start}`,
    page.timezone,
    "start time"
  );
  const endsAt = parseZonedDateTime(
    `${parsed.data.date}T${parsed.data.end}`,
    page.timezone,
    "end time"
  );
  if (endsAt <= startsAt) return { error: "End time must be after the start." };

  await prisma.bookingOpenSlot.create({
    data: {
      bookingPageId: page.id,
      startsAt,
      endsAt,
      label: parsed.data.label || null,
    },
  });

  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

export async function deleteBookingOpenSlot(
  slotId: string
): Promise<{ error: string | null }> {
  const page = await hostBookingPage();
  const existing = await prisma.bookingOpenSlot.findFirst({
    where: { id: slotId, bookingPageId: page.id },
    select: { id: true },
  });
  if (!existing) return { error: "Open slot not found" };
  await prisma.bookingOpenSlot.delete({ where: { id: slotId } });
  revalidatePath("/account/booking");
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

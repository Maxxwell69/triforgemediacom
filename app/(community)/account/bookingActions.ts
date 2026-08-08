"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { suggestBookingSlug } from "@/lib/booking";
import { bookingPageSettingsSchema, weeklyWindowSchema } from "@/lib/validations/booking";
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
  if (existing) return existing.id;

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
    },
  });
  revalidatePath("/account");
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
    },
  });

  revalidatePath("/account");
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
  revalidatePath(`/book/${page.slug}`);
  return { error: null };
}

import { z } from "zod";
import { BOOKING_TIMEZONES } from "@/lib/bookingClient";

export const bookingPageSettingsSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  timezone: z
    .string()
    .refine((t): t is (typeof BOOKING_TIMEZONES)[number] =>
      (BOOKING_TIMEZONES as readonly string[]).includes(t)
    ),
  durationMins: z.coerce.number().int().min(15).max(180),
  bufferMins: z.coerce.number().int().min(0).max(60),
  aheadDays: z.coerce.number().int().min(1).max(60),
  isActive: z.boolean().optional(),
});

export const weeklyWindowSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startMinute: z.coerce.number().int().min(0).max(24 * 60 - 1),
  endMinute: z.coerce.number().int().min(1).max(24 * 60),
});

export const publicBookSchema = z.object({
  startsAt: z.string().trim().min(1, "Pick a time slot"),
  meetingTypeId: z.string().trim().optional().or(z.literal("")),
  bookerName: z.string().trim().min(2).max(80),
  bookerEmail: z.string().trim().email(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const bookingMeetingTypeSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  durationMins: z.coerce.number().int().min(15).max(180),
});

export const bookingOpenSlotSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  start: z.string().trim().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  end: z.string().trim().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
  label: z.string().trim().max(80).optional().or(z.literal("")),
});

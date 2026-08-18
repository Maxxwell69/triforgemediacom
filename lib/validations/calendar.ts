import { z } from "zod";
import { parseZonedDateTime } from "@/lib/time";

export const calendarEventKindOptions = [
  "MEETING",
  "EVENT",
  "LIVE",
  "WEBINAR",
  "OTHER",
] as const;

export const calendarEventVisibilityOptions = ["HUB", "GROUP", "PRIVATE"] as const;

export const availabilityKindOptions = ["LIVE", "FREE", "BUSY"] as const;

export const calendarBookingStatusOptions = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
] as const;

export const calendarEventSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  kind: z.enum(calendarEventKindOptions),
  visibility: z.enum(calendarEventVisibilityOptions).optional(),
  startsAt: z.string().trim().min(1, "Start time is required"),
  endsAt: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  groupId: z.string().trim().optional().or(z.literal("")),
});

export const availabilitySlotSchema = z.object({
  kind: z.enum(availabilityKindOptions),
  label: z.string().trim().max(120).optional().or(z.literal("")),
  startsAt: z.string().trim().min(1, "Start time is required"),
  endsAt: z.string().trim().min(1, "End time is required"),
  isBookable: z.enum(["on", "true", "false"]).optional(),
});

export const bookingNotesSchema = z.object({
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export function parseDateTime(value: string, label = "Date", timeZone?: string | null): Date {
  return parseZonedDateTime(value, timeZone, label);
}

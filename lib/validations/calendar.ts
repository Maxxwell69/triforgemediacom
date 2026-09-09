import { z } from "zod";
import { parseZonedDateTime } from "@/lib/time";
import {
  calendarEventKindOptions,
  calendarKindNeedsFeatured,
  calendarKindNeedsOpponent,
} from "@/lib/calendarEventTypes";

export { calendarEventKindOptions } from "@/lib/calendarEventTypes";

export const calendarEventVisibilityOptions = ["HUB", "GROUP", "PRIVATE"] as const;

export const availabilityKindOptions = ["LIVE", "FREE", "BUSY"] as const;

export const calendarBookingStatusOptions = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "CANCELLED",
] as const;

export const calendarEventSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    kind: z.enum(calendarEventKindOptions),
    visibility: z.enum(calendarEventVisibilityOptions).optional(),
    startsAt: z.string().trim().min(1, "Start time is required"),
    endsAt: z.string().trim().optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    groupId: z.string().trim().optional().or(z.literal("")),
    featuredUserId: z.string().trim().optional().or(z.literal("")),
    opponentUserId: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (calendarKindNeedsFeatured(data.kind) && !data.featuredUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["featuredUserId"],
        message:
          data.kind === "INTERVIEW"
            ? "Pick the person being interviewed"
            : data.kind === "BATTLE"
              ? "Pick battler 1"
              : "Pick the featured profile",
      });
    }
    if (calendarKindNeedsOpponent(data.kind) && !data.opponentUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opponentUserId"],
        message: "Pick battler 2",
      });
    }
    if (
      data.kind === "BATTLE" &&
      data.featuredUserId &&
      data.opponentUserId &&
      data.featuredUserId === data.opponentUserId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["opponentUserId"],
        message: "Battles need two different profiles",
      });
    }
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

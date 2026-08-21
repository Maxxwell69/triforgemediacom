import { z } from "zod";

const optionalImageUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^https?:\/\//i.test(v),
    "Host avatar must be a valid image URL"
  );

export const webinarAudienceSchema = z.enum(["ALL", "CN", "MN", "ADMIN"]);

export const WEBINAR_AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All members" },
  { value: "CN", label: "Creator Network (CN)" },
  { value: "MN", label: "Media Network (MN)" },
  { value: "ADMIN", label: "Admins only" },
] as const;

export const WEBINAR_AUDIENCE_LABELS: Record<
  (typeof WEBINAR_AUDIENCE_OPTIONS)[number]["value"],
  string
> = {
  ALL: "All members",
  CN: "Creator Network (CN)",
  MN: "Media Network (MN)",
  ADMIN: "Admins only",
};

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

export const createWebinarSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  scheduledAt: z.string().min(1, "Schedule a date/time"),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("SCHEDULED"),
  audience: webinarAudienceSchema.default("ALL"),
  hostAvatarUrl: optionalImageUrl,
  /** Outside-network signup page for people who are not hub members. */
  externalSignupEnabled: z.boolean().default(false),
  /** When true, create one session per selected weekday for N weeks. */
  repeatWeekly: z.boolean().default(false),
  repeatWeeks: z.coerce.number().int().min(1).max(12).default(4),
});

export const updateWebinarSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  scheduledAt: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
  audience: webinarAudienceSchema.optional(),
  hostAvatarUrl: optionalImageUrl,
});

export const webinarExternalSignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
});

export const updateWebinarHostAvatarSchema = z.object({
  hostAvatarUrl: optionalImageUrl,
});

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "Message required").max(1000),
});

export const stageInviteSchema = z.object({
  userId: z.string().min(1),
  approve: z.boolean().default(true),
});

export const webinarModerateSchema = z.object({
  action: z.enum([
    "invite_stage",
    "remove_stage",
    "demote_host",
    "kick",
    "mute_chat",
    "unmute_chat",
    "delete_message",
    "clear_chat",
  ]),
  userId: z.string().min(1).optional(),
  messageId: z.string().min(1).optional(),
  /** Chat mute duration; omit or 0 = rest of session (~24h, cleared on webinar end). */
  durationMinutes: z.number().int().min(0).max(10080).optional(),
});

export const webinarRecordingSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  url: z
    .string()
    .trim()
    .url("Enter a valid video URL")
    .max(2000),
});

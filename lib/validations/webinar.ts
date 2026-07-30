import { z } from "zod";

export const createWebinarSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  scheduledAt: z.string().min(1, "Schedule a date/time"),
  status: z.enum(["DRAFT", "SCHEDULED"]).default("SCHEDULED"),
});

export const updateWebinarSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  scheduledAt: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
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

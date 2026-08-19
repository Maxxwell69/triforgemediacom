import { z } from "zod";

export const progressionApplySchema = z.object({
  whyJoin: z
    .string()
    .trim()
    .min(20, "Tell us a bit more about why you want in (at least 20 characters)")
    .max(2000),
  goals: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const progressionSettingsSchema = z.object({
  memberVisible: z.boolean(),
  explainerVideoUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  explainerHeadline: z.string().trim().min(2).max(120),
  explainerBody: z.string().trim().max(4000).optional().or(z.literal("")),
});

export const progressionNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

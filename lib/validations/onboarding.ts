import { z } from "zod";
import { platformOptions } from "./apply";
import { GOAL_OPTIONS } from "../goals";

const goalKeys = GOAL_OPTIONS.map((g) => g.key) as [string, ...string[]];

export const onboardingSchema = z.object({
  platform: z.enum(platformOptions, { error: "Select your main platform" }),
  goals: z.array(z.enum(goalKeys)).min(1, "Pick at least one goal"),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  tiktokUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  twitchUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  youtubeUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  pinnedTiktokVideoUrl: z
    .string()
    .trim()
    .url()
    .max(300)
    .refine((v) => v.includes("tiktok.com"), { message: "Must be a tiktok.com video link" })
    .optional()
    .or(z.literal("")),
});

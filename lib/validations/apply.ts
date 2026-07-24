import { z } from "zod";

export const platformOptions = [
  "TIKTOK",
  "TWITCH",
  "YOUTUBE",
  "KICK",
  "INSTAGRAM",
  "OTHER",
] as const;

export const applySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  platform: z.enum(platformOptions, {
    error: "Select your main platform",
  }),
  handle: z.string().trim().min(1, "Enter your handle/username").max(100),
  socialLink: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(300)
    .optional()
    .or(z.literal("")),
  goals: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about your goals (10+ characters)")
    .max(1000),
  whyJoin: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about why you want in (10+ characters)")
    .max(1000),
});

export type ApplyInput = z.infer<typeof applySchema>;

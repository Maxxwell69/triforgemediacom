import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/applyTrack";

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
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+()\-.\s]+$/, "Enter a valid phone number"),
  smsConsent: z.boolean().optional().default(false),
  socialLink: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(300)
    .optional()
    .or(z.literal("")),
  country: z.enum(COUNTRY_CODES, {
    error: "Select your country",
  }),
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
  hasAgency: z.enum(["yes", "no"], {
    error: "Let us know if you have an agency representing you",
  }),
});

export type ApplyInput = z.infer<typeof applySchema>;

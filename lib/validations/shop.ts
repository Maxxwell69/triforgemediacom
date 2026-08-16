import { z } from "zod";

export const shopProductSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  kind: z.enum(["PHYSICAL", "DIGITAL"]).optional(),
});

export const shopVariantSchema = z.object({
  title: z.string().trim().min(1, "Variant name is required").max(80),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
});

export const shopSettingsSchema = z.object({
  name: z.string().trim().min(2, "Shop name must be at least 2 characters").max(80),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code (e.g. usd)")
    .transform((value) => value.toLowerCase()),
  isPublished: z.boolean(),
});

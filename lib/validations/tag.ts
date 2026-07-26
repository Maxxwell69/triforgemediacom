import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(30),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color, e.g. #00D4FF"),
});

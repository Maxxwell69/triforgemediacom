import { z } from "zod";

export const progressionNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

import { z } from "zod";

export const badgeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  icon: z.string().trim().max(10).optional().or(z.literal("")),
});

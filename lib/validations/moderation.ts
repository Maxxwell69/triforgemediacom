import { z } from "zod";

export const muteSchema = z.object({
  durationMinutes: z.coerce.number().int().min(1).max(10080).optional(),
});

export const deleteMessageSchema = z.object({
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});

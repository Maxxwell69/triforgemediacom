import { z } from "zod";

export const pointsAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int("Amount must be a whole number")
    .refine((v) => v !== 0, "Amount can't be zero"),
  note: z.string().trim().max(280).optional().or(z.literal("")),
});

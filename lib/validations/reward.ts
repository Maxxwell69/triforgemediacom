import { z } from "zod";

export const rewardSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  costPoints: z.coerce.number().int().min(1, "Cost must be at least 1 point").max(1000000),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(500)
    .optional()
    .or(z.literal("")),
});

// Handled separately from the main schema since an empty string means
// "unlimited" (null), which z.coerce.number() would otherwise silently
// coerce to 0.
export function parseStockField(raw: FormDataEntryValue | null): number | null {
  if (raw === null || String(raw).trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Stock must be a non-negative whole number, or blank for unlimited");
  }
  return value;
}

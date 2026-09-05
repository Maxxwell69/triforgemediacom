import { z } from "zod";
import { SUGGESTION_STATUSES } from "@/lib/suggestions";

export const createSuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(140, "Title must be under 140 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about the idea")
    .max(5000, "Description must be under 5000 characters"),
});

export const updateSuggestionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(SUGGESTION_STATUSES),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

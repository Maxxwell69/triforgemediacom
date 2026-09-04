import { z } from "zod";

export const personalTaskStatusOptions = ["TODO", "IN_PROGRESS", "DONE"] as const;

export const personalTaskCategoryOptions = [
  "Content",
  "Live",
  "Admin",
  "Personal",
  "Networking",
] as const;

export const personalTaskCategorySchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .nullable()
  .or(z.literal(""));

export const createPersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
  category: personalTaskCategorySchema,
});

export const updatePersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(personalTaskStatusOptions).optional(),
  dueAt: z.string().optional().nullable().or(z.literal("")),
  category: personalTaskCategorySchema,
});

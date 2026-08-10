import { z } from "zod";

export const personalTaskStatusOptions = ["TODO", "IN_PROGRESS", "DONE"] as const;

export const createPersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
});

export const updatePersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(personalTaskStatusOptions).optional(),
  dueAt: z.string().optional().nullable().or(z.literal("")),
});

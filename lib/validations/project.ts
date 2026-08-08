import { z } from "zod";

export const projectStatusOptions = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "DONE",
  "ARCHIVED",
] as const;

export const projectTaskStatusOptions = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(projectStatusOptions).optional(),
  groupId: z.string().trim().optional().or(z.literal("")),
});

export const projectTaskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(projectTaskStatusOptions).optional(),
  assigneeId: z.string().trim().optional().or(z.literal("")),
  dueAt: z.string().trim().optional().or(z.literal("")),
});

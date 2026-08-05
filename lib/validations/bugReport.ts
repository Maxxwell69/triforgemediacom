import { z } from "zod";
import { BUG_REPORT_STATUSES } from "@/lib/bugs";

export const createBugReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Describe the bug in a bit more detail")
    .max(5000, "Description must be under 5000 characters"),
});

export const updateBugReportSchema = z.object({
  id: z.string().min(1),
  status: z.enum(BUG_REPORT_STATUSES),
  reportedAt: z.string().min(1, "Reported time is required"),
  fixedAt: z.string().optional().or(z.literal("")),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

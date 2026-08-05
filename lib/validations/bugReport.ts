import { z } from "zod";
import { BUG_REPORT_PLATFORMS, BUG_REPORT_STATUSES } from "@/lib/bugs";

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
  platform: z.enum(BUG_REPORT_PLATFORMS, { error: "Select where you saw the bug" }),
  pageUrl: z
    .string()
    .trim()
    .max(2000, "URL is too long")
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\//i.test(v) || v.startsWith("/"),
      "Enter a full URL (https://…) or a path starting with /"
    ),
});

export const updateBugReportSchema = z.object({
  id: z.string().min(1),
  status: z.enum(BUG_REPORT_STATUSES),
  reporterId: z.string().min(1, "Select who gets credit"),
  reportedAt: z.string().min(1, "Reported time is required"),
  fixedAt: z.string().optional().or(z.literal("")),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

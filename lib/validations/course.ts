import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  thumbnailUrl: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  xpReward: z.coerce.number().int().min(0).max(100000),
  completionGroupId: z.string().trim().optional().or(z.literal("")),
});

export const moduleSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  videoUrl: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
  audioUrl: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
  htmlEmbed: z.string().trim().max(10000).optional().or(z.literal("")),
  content: z.string().trim().max(20000).optional().or(z.literal("")),
  moduleId: z.string().trim().optional().or(z.literal("")),
  dripDaysAfterEnroll: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }, z.number().int().min(0).max(3650).nullable()),
  dripUnlockAt: z.string().trim().optional().or(z.literal("")),
});

export const quizSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(150),
  passScore: z.coerce.number().int().min(0).max(100),
});

export const QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTI_SELECT"] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const questionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  text: z.string().trim().min(2, "Question text is too short").max(500),
});

export const badgeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  icon: z.string().trim().max(20).optional().or(z.literal("")),
});

/**
 * Parses the newline-or-comma-separated options textarea into a clean
 * string array. Newlines take priority when both are present.
 */
export function parseOptionsField(raw: string): string[] {
  const hasNewlines = raw.includes("\n");
  const parts = hasNewlines ? raw.split("\n") : raw.split(",");
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

/** Convert a datetime-local form value to a Date, or null if empty. */
export function parseDatetimeLocal(raw: string | null | undefined): Date | null {
  if (!raw || !String(raw).trim()) return null;
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) throw new Error("Invalid unlock date");
  return d;
}

/** Format a Date for a datetime-local input value. */
export function toDatetimeLocalValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

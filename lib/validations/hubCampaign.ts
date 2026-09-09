import { z } from "zod";

export const hubCampaignCategoryOptions = [
  "INTERVIEWS",
  "MEETING",
  "GAMES",
  "BATTLES",
] as const;

export const hubCampaignStatusOptions = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"] as const;

export const hubCampaignAudienceOptions = ["ALL_MEMBERS", "TAG", "BADGE"] as const;

export const hubCampaignSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    category: z.enum(hubCampaignCategoryOptions),
    status: z.enum(hubCampaignStatusOptions).optional(),
    startsAt: z.string().trim().optional().or(z.literal("")),
    endsAt: z.string().trim().optional().or(z.literal("")),
    location: z.string().trim().max(300).optional().or(z.literal("")),
    audienceType: z.enum(hubCampaignAudienceOptions),
    audienceTagId: z.string().trim().optional().or(z.literal("")),
    audienceBadgeId: z.string().trim().optional().or(z.literal("")),
    capacity: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.audienceType === "TAG" && !data.audienceTagId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a tag for this audience",
        path: ["audienceTagId"],
      });
    }
    if (data.audienceType === "BADGE" && !data.audienceBadgeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a badge for this audience",
        path: ["audienceBadgeId"],
      });
    }
    if (data.capacity) {
      const n = Number(data.capacity);
      if (!Number.isInteger(n) || n < 1 || n > 5000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Capacity must be a whole number from 1 to 5000",
          path: ["capacity"],
        });
      }
    }
  });

export const hubCampaignTaskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  assigneeId: z.string().trim().optional().or(z.literal("")),
});

export const INTERVIEW_SLOT_DURATIONS = [15, 30, 45, 60] as const;

export const hubCampaignSlotSchema = z.object({
  startsAt: z.string().trim().min(1, "Start time is required"),
  durationMins: z.coerce
    .number()
    .refine(
      (n) => (INTERVIEW_SLOT_DURATIONS as readonly number[]).includes(n),
      "Pick 15, 30, 45, or 60 minutes"
    ),
});

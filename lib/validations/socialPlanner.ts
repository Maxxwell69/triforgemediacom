import { z } from "zod";
import { SOCIAL_PLANNER_KINDS, SOCIAL_PLANNER_PRIVACY } from "@/lib/socialPlanner/labels";

export const socialPlannerItemSchema = z.object({
  accountId: z.string().trim().min(1, "Connect a TikTok account first"),
  kind: z.enum(SOCIAL_PLANNER_KINDS),
  caption: z.string().trim().max(2200).optional().or(z.literal("")),
  title: z.string().trim().max(2200).optional().or(z.literal("")),
  privacyLevel: z.enum(SOCIAL_PLANNER_PRIVACY).optional(),
  disableComment: z.enum(["on", "true", "false"]).optional(),
  disableDuet: z.enum(["on", "true", "false"]).optional(),
  disableStitch: z.enum(["on", "true", "false"]).optional(),
  scheduledAt: z.string().trim().optional().or(z.literal("")),
  publishNow: z.enum(["on", "true", "false"]).optional(),
  saveDraft: z.enum(["on", "true", "false"]).optional(),
  consent: z.enum(["on", "true"]).optional(),
  addToCalendar: z.enum(["on", "true", "false"]).optional(),
  mediaR2Key: z.string().trim().max(500).optional().or(z.literal("")),
  mediaUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  mediaMime: z.string().trim().max(80).optional().or(z.literal("")),
  mediaBytes: z.string().trim().optional().or(z.literal("")),
});

export function formFlagOn(value: string | undefined): boolean {
  return value === "on" || value === "true";
}

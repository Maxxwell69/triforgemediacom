import { z } from "zod";

export const onboardingTrackScopeOptions = ["ALL", "CN", "MN"] as const;
export const onboardingActionTypeOptions = ["LINK", "CONFIRM", "COURSE_LINK", "CUSTOM"] as const;

export const onboardingModuleSettingsSchema = z.object({
  enabled: z.enum(["on", "true", "false"]).optional(),
  dismissalDisclaimerText: z
    .string()
    .trim()
    .min(8, "Disclaimer must be at least 8 characters")
    .max(2000),
  requiredCourseIds: z.array(z.string().trim().min(1)).max(50).optional(),
  completionXpReward: z.coerce.number().int().min(0).max(10000),
});

export const onboardingStepSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
    description: z.string().trim().max(1000).optional().or(z.literal("")),
    trackScope: z.enum(onboardingTrackScopeOptions),
    actionType: z.enum(onboardingActionTypeOptions),
    actionTarget: z.string().trim().max(400).optional().or(z.literal("")),
    xpReward: z.coerce.number().int().min(0).max(10000),
  })
  .superRefine((data, ctx) => {
    const target = (data.actionTarget || "").trim();
    if (data.actionType === "CONFIRM") return;
    if (!target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actionTarget"],
        message:
          data.actionType === "COURSE_LINK" ? "Pick a course" : "Enter a link or path",
      });
    }
  });

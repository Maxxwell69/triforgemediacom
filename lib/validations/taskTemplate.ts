import { z } from "zod";
import { platformOptions } from "./apply";
import { GOAL_OPTIONS } from "../goals";

const goalKeys = GOAL_OPTIONS.map((g) => g.key) as [string, ...string[]];

export const taskTemplateSchema = z.object({
  platform: z.enum(platformOptions).nullable().optional(),
  goalKey: z.enum(goalKeys).nullable().optional(),
  taskText: z.string().trim().min(3, "Task text is too short").max(300),
  xpValue: z.coerce.number().int().min(1).max(1000),
});

import { z } from "zod";

export const roleOptions = ["MEMBER", "CREATOR", "MOD", "ADMIN"] as const;

export const channelSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  minRole: z.enum(roleOptions, { error: "Select a minimum role" }),
});

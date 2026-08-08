import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color, e.g. #FD4802"),
  imageUrl: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
  joinMode: z.enum(["INVITE_ONLY", "APPLY", "CLOSED"]).optional(),
});

export const groupMemberRoleSchema = z.enum(["MANAGER", "MOD", "MEMBER"]);

export const groupApplicationMessageSchema = z.object({
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

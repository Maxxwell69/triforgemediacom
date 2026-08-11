import { z } from "zod";

export const broadcastDraftSchema = z.object({
  topic: z.string().trim().min(5, "Give the AI a bit more to work with (at least 5 characters)"),
});

export const broadcastAudienceSchema = z.discriminatedUnion("audienceType", [
  z.object({ audienceType: z.literal("ALL_MEMBERS") }),
  z.object({ audienceType: z.literal("TAG"), tagId: z.string().min(1) }),
  z.object({ audienceType: z.literal("GROUP"), groupId: z.string().min(1) }),
  z.object({
    audienceType: z.literal("SINGLE_USER"),
    email: z.string().trim().email("Enter a valid email"),
  }),
  z.object({
    audienceType: z.literal("NETWORK_TRACK"),
    track: z.enum(["CN", "MN"]),
  }),
]);

export const broadcastContentSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required").max(150),
  bodyHtml: z.string().trim().min(1, "Email body can't be empty"),
});

/** Persist a shared draft — body may be empty while still composing. */
export const saveBroadcastDraftSchema = z.object({
  draftId: z.string().min(1).optional().nullable(),
  subject: z.string().trim().min(1, "Subject is required").max(150),
  bodyText: z.string().max(50_000).default(""),
});

import { z } from "zod";

const messageContent = z
  .string()
  .trim()
  .max(2000, "Message is too long");

export const postMessageSchema = z
  .object({
    content: messageContent.optional().default(""),
    replyToId: z.string().min(1).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasText = Boolean(data.content?.trim());
    const hasImage = Boolean(data.imageUrl);
    if (!hasText && !hasImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message can't be empty",
        path: ["content"],
      });
    }
  });

export const editMessageSchema = z.object({
  content: z.string().trim().max(2000, "Message is too long"),
});

import { z } from "zod";

const messageContent = z
  .string()
  .trim()
  .min(1, "Message can't be empty")
  .max(2000, "Message is too long");

export const postMessageSchema = z.object({
  content: messageContent,
  replyToId: z.string().min(1).optional().nullable(),
});

export const editMessageSchema = z.object({
  content: messageContent,
});

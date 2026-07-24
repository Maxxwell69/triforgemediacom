import { z } from "zod";

export const postMessageSchema = z.object({
  content: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
});

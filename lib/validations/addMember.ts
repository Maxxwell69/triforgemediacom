import { z } from "zod";

export const addMemberSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

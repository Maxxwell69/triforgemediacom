import { z } from "zod";
import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_STATUSES } from "@/lib/support";

export const createSupportTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(140, "Subject must be under 140 characters"),
  category: z.enum(SUPPORT_TICKET_CATEGORIES, { error: "Select a category" }),
  body: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about what you need")
    .max(5000, "Message must be under 5000 characters"),
});

export const supportTicketReplySchema = z.object({
  ticketId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(2, "Reply is too short")
    .max(5000, "Reply must be under 5000 characters"),
});

export const updateSupportTicketSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(SUPPORT_TICKET_STATUSES),
  assigneeId: z.string().optional().or(z.literal("")),
});

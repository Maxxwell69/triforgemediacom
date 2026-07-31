import { chatAuthorSelect } from "@/lib/memberDisplay";

/** Prisma include for a message's reply preview (author + short content). */
export const replyToInclude = {
  select: {
    id: true,
    content: true,
    user: { select: chatAuthorSelect },
  },
} as const;

export function truncateReplyPreview(content: string, max = 120): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

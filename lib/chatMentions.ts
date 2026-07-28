/**
 * Mentions are stored inline as `@[Display Name](userId)` so content stays
 * a single string while remaining parseable for links / autocomplete.
 */

export const MENTION_TOKEN_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

export type MentionMember = {
  id: string;
  name: string;
};

export function buildMentionToken(member: MentionMember): string {
  const safeName = member.name.replace(/[\[\]]/g, "").trim() || "Member";
  return `@[${safeName}](${member.id})`;
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; userId: string; name: string };

export function parseMentionSegments(content: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  const re = new RegExp(MENTION_TOKEN_RE.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", name: match[1], userId: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ type: "text", value: content }];
}

/** Active `@query` at the caret, if any. */
export function getActiveMentionQuery(
  value: string,
  caret: number
): { start: number; query: string } | null {
  const before = value.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1]!)) return null;
  const query = before.slice(at + 1);
  if (query.includes(" ") || query.includes("\n") || query.includes("[")) return null;
  return { start: at, query };
}

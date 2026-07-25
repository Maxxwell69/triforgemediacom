import DOMPurify from "isomorphic-dompurify";

// Allowlist for admin-authored lesson body content. Deliberately excludes
// <script>, <iframe>, <object>, <form>, and event-handler / javascript:
// attributes — video/slide embeds go through the separate, more tightly
// sanitized `htmlEmbed` field (see lib/videoEmbed.ts).
const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "blockquote", "code", "pre",
  "ul", "ol", "li",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "div", "span",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "width", "height",
  "style", "class", "title",
  "colspan", "rowspan",
];

/**
 * Sanitizes admin-authored lesson HTML before it's rendered to members via
 * dangerouslySetInnerHTML. Plain text without any tags passes through
 * unchanged (still safe — DOMPurify only strips disallowed markup).
 */
export function sanitizeLessonHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS, ALLOWED_ATTR });
}

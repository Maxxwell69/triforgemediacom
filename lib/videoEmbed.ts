/**
 * Converts a raw YouTube or Vimeo URL into an embeddable iframe `src`.
 * Returns null for anything else so callers can skip rendering the video
 * block gracefully instead of erroring.
 */
export function getVideoEmbedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (url.pathname.startsWith("/embed/")) {
      return `https://www.youtube.com${url.pathname}`;
    }
    if (url.pathname.startsWith("/shorts/")) {
      const videoId = url.pathname.split("/")[2];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  }

  if (host === "youtu.be") {
    const videoId = url.pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === "vimeo.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const videoId = segments[0];
    return videoId && /^\d+$/.test(videoId) ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  if (host === "player.vimeo.com") {
    return url.pathname.startsWith("/video/") ? url.toString() : null;
  }

  return null;
}

export type SanitizedIframe = {
  src: string;
  width?: string;
  height?: string;
  allow?: string;
  allowFullScreen: boolean;
  frameBorder?: string;
  title?: string;
};

const ALLOWED_IFRAME_ATTRS = new Set([
  "src",
  "width",
  "height",
  "allow",
  "allowfullscreen",
  "frameborder",
  "title",
]);

/**
 * Strict allowlist sanitizer for lesson HTML embeds. Accepts a single
 * <iframe> with a safe https src and a small set of presentation attrs.
 * Rejects scripts, event handlers, javascript: URLs, and anything that
 * isn't exactly one clean iframe — callers should skip rendering on null.
 */
export function sanitizeHtmlEmbed(raw: string | null | undefined): SanitizedIframe | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Reject anything that isn't a single iframe element
  if (/<script[\s>]/i.test(trimmed) || /javascript:/i.test(trimmed)) return null;
  if (/on\w+\s*=/i.test(trimmed)) return null;

  const match = trimmed.match(/^<iframe\b([^>]*)>(?:\s*<\/iframe>)?$/i);
  if (!match) return null;

  const attrString = match[1];
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (!ALLOWED_IFRAME_ATTRS.has(name)) continue;
    attrs[name] = value;
  }

  const src = attrs.src?.trim();
  if (!src) return null;

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (/javascript:/i.test(src)) return null;

  return {
    src: parsed.toString(),
    width: attrs.width,
    height: attrs.height,
    allow: attrs.allow,
    allowFullScreen: "allowfullscreen" in attrs,
    frameBorder: attrs.frameborder,
    title: attrs.title,
  };
}

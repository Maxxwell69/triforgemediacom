/** Client-safe TikTok handle helpers — no API keys or server imports. */

/** Extract TikTok uniqueId (no @) from a profile URL, @handle, or bare handle. */
export function parseTikTokUniqueId(urlOrHandle: string | null | undefined): string | null {
  if (!urlOrHandle) return null;
  let raw = urlOrHandle.trim();
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // keep original if it isn't a valid encoding
  }
  raw = raw.replace(/^["']+|["']+$/g, "");

  const fromUrl = raw.match(/(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)/i);
  if (fromUrl) return normalizeTikTokUniqueId(fromUrl[1]);

  const fromQuery = raw.match(/[?&](?:unique_id|uniqueId|username)=@?([\w.-]+)/i);
  if (fromQuery) return normalizeTikTokUniqueId(fromQuery[1]);

  if (/^https?:\/\//i.test(raw)) return null;

  const bare = raw.replace(/^@/, "").trim();
  if (/^[\w.-]+$/.test(bare) && bare.length >= 2 && bare.length <= 64) {
    if (/^[a-z0-9-]+\.(com|net|org|io|co|tv)$/i.test(bare)) return null;
    return normalizeTikTokUniqueId(bare);
  }

  return null;
}

function normalizeTikTokUniqueId(value: string): string {
  return value.replace(/\.+$/, "").toLowerCase();
}

/** Canonical stored / displayed handle, e.g. `@username`. */
export function formatTikTokHandle(uniqueId: string): string {
  return `@${uniqueId.replace(/^@/, "").toLowerCase()}`;
}

export function tiktokProfileUrl(uniqueId: string): string {
  return `https://www.tiktok.com/@${uniqueId.replace(/^@/, "").toLowerCase()}`;
}

/** Show @username even when the stored value is a full TikTok (or other) link. */
export function displayCreatorHandle(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const tiktok = parseTikTokUniqueId(raw);
  if (tiktok) return formatTikTokHandle(tiktok);
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const last = new URL(trimmed).pathname.replace(/\/+$/, "").split("/").pop() || "";
      const bare = last.replace(/^@/, "");
      if (/^[\w.-]{2,64}$/.test(bare)) return `@${bare}`;
    } catch {
      return null;
    }
    return null;
  }
  const bare = trimmed.replace(/^@/, "").trim();
  return bare ? `@${bare}` : null;
}

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

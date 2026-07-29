import { getVideoEmbedUrl } from "@/lib/videoEmbed";

/** True when the URL looks like a direct video file we can play with <video>. */
export function isDirectVideoUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return /\.(mp4|webm|mov)(\?|#|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

export type RecordingPlayback =
  | { kind: "embed"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

export function resolveRecordingPlayback(url: string): RecordingPlayback {
  const embed = getVideoEmbedUrl(url);
  if (embed) return { kind: "embed", src: embed };
  if (isDirectVideoUrl(url)) return { kind: "file", src: url.trim() };
  return { kind: "link", src: url.trim() };
}

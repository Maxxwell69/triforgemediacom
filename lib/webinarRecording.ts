import { getVideoEmbedUrl, isDirectVideoUrl } from "@/lib/videoEmbed";

export { isDirectVideoUrl } from "@/lib/videoEmbed";

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

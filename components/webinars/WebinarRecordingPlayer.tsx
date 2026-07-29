import { resolveRecordingPlayback } from "@/lib/webinarRecording";

export default function WebinarRecordingPlayer({
  url,
  title,
}: {
  url: string;
  title?: string | null;
}) {
  const playback = resolveRecordingPlayback(url);

  return (
    <div className="overflow-hidden rounded-xl border border-off-white/10 bg-charcoal">
      {title && (
        <p className="border-b border-off-white/10 px-4 py-2 font-body text-sm font-semibold text-off-white/80">
          {title}
        </p>
      )}
      {playback.kind === "embed" && (
        <div className="aspect-video w-full">
          <iframe
            src={playback.src}
            title={title || "Webinar recording"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {playback.kind === "file" && (
        <video
          src={playback.src}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        >
          Your browser does not support video playback.
        </video>
      )}
      {playback.kind === "link" && (
        <div className="px-4 py-6">
          <a
            href={playback.src}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-cyan hover:underline"
          >
            Open recording →
          </a>
        </div>
      )}
    </div>
  );
}

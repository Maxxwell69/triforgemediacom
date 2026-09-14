import { getVideoEmbedUrl, isDirectVideoUrl } from "@/lib/videoEmbed";

export default function VideoEmbed({ url }: { url: string | null }) {
  if (!url) return null;
  const embedSrc = getVideoEmbedUrl(url);
  if (embedSrc) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-charcoal">
        <iframe
          src={embedSrc}
          title="Video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideoUrl(url)) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-charcoal">
        <video
          src={url.trim()}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full bg-black"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  return null;
}

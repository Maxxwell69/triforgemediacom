import { getVideoEmbedUrl } from "@/lib/videoEmbed";

export default function VideoEmbed({ url }: { url: string | null }) {
  const src = getVideoEmbedUrl(url);
  if (!src) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-charcoal">
      <iframe
        src={src}
        title="Video"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

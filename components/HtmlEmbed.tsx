import { sanitizeHtmlEmbed } from "@/lib/videoEmbed";

export default function HtmlEmbed({ html }: { html: string | null }) {
  const iframe = sanitizeHtmlEmbed(html);
  if (!iframe) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-charcoal">
      <iframe
        src={iframe.src}
        title={iframe.title || "Lesson embed"}
        className="h-full w-full"
        width={iframe.width}
        height={iframe.height}
        allow={iframe.allow}
        allowFullScreen={iframe.allowFullScreen}
        // frameBorder is deprecated in React; use style/border via class instead
      />
    </div>
  );
}

// TikTok's official oEmbed endpoint — no API key required. Given a video
// url it returns embed markup (a <blockquote>) that the TikTok embed script
// hydrates into a real player client-side. This only works for a specific
// video url, not a whole profile — TikTok has no public "embed my profile"
// widget.
export async function getTikTokEmbedHtml(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.html === "string" ? data.html : null;
  } catch {
    return null;
  }
}

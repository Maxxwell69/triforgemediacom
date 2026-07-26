"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the <blockquote class="tiktok-embed"> markup TikTok's oEmbed API
 * returns, then loads their embed script to hydrate it into a real player.
 * A fresh script tag is appended on every mount — TikTok's script scans the
 * page for un-hydrated blockquotes on load, so this is safe even if other
 * embeds already ran it.
 */
export default function TikTokEmbed({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="flex justify-center overflow-hidden rounded-xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

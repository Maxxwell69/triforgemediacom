"use client";

import { useEffect, useRef, useState } from "react";

// Real, official share-intent popups. These accept ANY external url — they
// are the "share channel", not the platform the content lives on. TikTok,
// Instagram, and YouTube don't offer a public web intent for sharing
// arbitrary outside links (they only accept posts made from their own
// apps), so they're intentionally not listed here — there is no website
// that can pop open "share to TikTok" for a link, that's a restriction on
// their end, not something we can build.
const SHARE_TARGETS: {
  key: string;
  label: string;
  icon: string;
  buildUrl: (url: string, text: string, title: string) => string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "x",
    label: "X",
    icon: "✖️",
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    buildUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "✈️",
    buildUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "email",
    label: "Email",
    icon: "✉️",
    buildUrl: (url, text, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

function openSharePopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
}

export default function ShareButton({
  title,
  text,
  url,
  label = "Share",
  className = "",
}: {
  title: string;
  text?: string;
  url: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const shareText = text || title;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      // User cancelled the native share sheet — no-op.
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          className ||
          "rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
        }
      >
        {copied ? "Link copied!" : `🔗 ${label}`}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-off-white/15 bg-charcoal p-1.5 shadow-xl">
          {SHARE_TARGETS.map((target) => (
            <button
              key={target.key}
              type="button"
              onClick={() => {
                openSharePopup(target.buildUrl(url, shareText, title));
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 transition hover:bg-off-white/10 hover:text-off-white"
            >
              <span aria-hidden="true">{target.icon}</span>
              {target.label}
            </button>
          ))}

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 transition hover:bg-off-white/10 hover:text-off-white"
            >
              <span aria-hidden="true">📱</span>
              More options&hellip;
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              handleCopy();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 transition hover:bg-off-white/10 hover:text-off-white"
          >
            <span aria-hidden="true">🔗</span>
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

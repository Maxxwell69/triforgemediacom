"use client";

import { useEffect, useRef, useState } from "react";
import { SHARE_XP_REWARD } from "@/lib/shareRewards";

// Two kinds of targets:
// - "popup": a real official share-intent URL that accepts ANY external
//   link (Facebook, X, WhatsApp, Telegram, Email all support this).
// - "copy": TikTok and Instagram have no public web intent for sharing an
//   arbitrary outside link — they only accept posts/bio links made from
//   inside their own app, so there is no URL we can pop open that hands the
//   link straight to a new TikTok/Instagram post. Best equivalent: copy the
//   link and tell the creator exactly where to paste it (bio / caption).
type ShareTarget =
  | {
      key: string;
      label: string;
      icon: string;
      type: "popup";
      buildUrl: (url: string, text: string, title: string) => string;
    }
  | {
      key: string;
      label: string;
      icon: string;
      type: "copy";
      instructions: string;
    };

const SHARE_TARGETS: ShareTarget[] = [
  {
    key: "tiktok",
    label: "TikTok",
    icon: "🎵",
    type: "copy",
    instructions: "Link copied — paste it in your TikTok bio or video caption!",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "📸",
    type: "copy",
    instructions: "Link copied — paste it in your Instagram bio or story!",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👍",
    type: "popup",
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "x",
    label: "X",
    icon: "✖️",
    type: "popup",
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    type: "popup",
    buildUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "✈️",
    type: "popup",
    buildUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "email",
    label: "Email",
    icon: "✉️",
    type: "popup",
    buildUrl: (url, text, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

function openSharePopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
}

type AwardResult = { alreadyClaimed: boolean; xpAwarded: number };

async function recordShare(context: string): Promise<AwardResult | null> {
  try {
    const res = await fetch("/api/share/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    if (!res.ok) return null;
    return (await res.json()) as AwardResult;
  } catch {
    return null;
  }
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
  const [feedback, setFeedback] = useState<string | null>(null);
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

  function showFeedback(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  }

  async function awardAndAnnounce(actionLabel: string, context: string) {
    const result = await recordShare(context);
    if (result && !result.alreadyClaimed) {
      showFeedback(`${actionLabel} +${result.xpAwarded} XP!`);
    } else if (result?.alreadyClaimed) {
      showFeedback(`${actionLabel} (today's bonus already claimed)`);
    } else {
      showFeedback(actionLabel);
    }
  }

  async function handleTargetClick(target: ShareTarget) {
    setOpen(false);

    if (target.type === "copy") {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt("Copy this link:", url);
      }
      await awardAndAnnounce(target.instructions, `${target.label}: ${title}`);
      return;
    }

    openSharePopup(target.buildUrl(url, shareText, title));
    await awardAndAnnounce(`Shared to ${target.label}!`, `${target.label}: ${title}`);
  }

  async function handleNativeShare() {
    setOpen(false);
    try {
      await navigator.share({ title, text: shareText, url });
    } catch {
      return; // user cancelled the native share sheet — no award, no message
    }
    await awardAndAnnounce("Shared!", `native share: ${title}`);
  }

  async function handleCopy() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
    await awardAndAnnounce("Link copied!", `copy link: ${title}`);
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
        🔗 {label}
      </button>

      {feedback && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-cyan/30 bg-charcoal px-3 py-2 font-body text-xs text-off-white/90 shadow-xl">
          {feedback}
        </div>
      )}

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-off-white/15 bg-charcoal p-1.5 shadow-xl">
          <p className="px-3 py-1.5 font-body text-[11px] text-off-white/40">
            Earn +{SHARE_XP_REWARD} XP for your first share today
          </p>
          {SHARE_TARGETS.map((target) => (
            <button
              key={target.key}
              type="button"
              onClick={() => handleTargetClick(target)}
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
            onClick={handleCopy}
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

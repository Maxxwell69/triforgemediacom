"use client";

import { useEffect, useRef, useState } from "react";
import { COMPOSER_EMOJI } from "@/lib/chatEmoji";

export default function EmojiPickerButton({
  onPick,
  disabled,
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Add emoji"
        className="rounded-lg border border-off-white/15 px-3 py-2.5 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
      >
        😀
      </button>
      {open && (
        <div className="glass absolute bottom-full right-0 z-20 mb-2 grid w-64 grid-cols-8 gap-1 rounded-xl p-2 shadow-lg">
          {COMPOSER_EMOJI.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="rounded-lg p-1.5 text-lg transition hover:bg-off-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

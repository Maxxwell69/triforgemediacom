"use client";

import { useState } from "react";
import { QUICK_REACTIONS } from "@/lib/chatEmoji";
import type { ReactionSummary } from "@/lib/dmAccess";

export default function MessageReactions({
  reactions,
  onToggle,
  disabled,
}: {
  reactions: ReactionSummary[];
  onToggle: (emoji: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function toggle(emoji: string) {
    if (disabled || busy) return;
    setBusy(emoji);
    try {
      await onToggle(emoji);
    } finally {
      setBusy(null);
      setPickerOpen(false);
    }
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          disabled={disabled || busy === r.emoji}
          onClick={() => toggle(r.emoji)}
          className={`rounded-full border px-2 py-0.5 font-body text-xs transition ${
            r.reactedByMe
              ? "border-cyan/50 bg-cyan/15 text-cyan"
              : "border-off-white/15 bg-off-white/5 text-off-white/70 hover:border-cyan/30"
          } disabled:opacity-40`}
        >
          {r.emoji} {r.count}
        </button>
      ))}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen((v) => !v)}
          title="Add reaction"
          className="rounded-full border border-off-white/10 px-2 py-0.5 font-body text-xs text-off-white/40 opacity-0 transition hover:border-cyan/30 hover:text-cyan group-hover:opacity-100 disabled:opacity-40"
        >
          +
        </button>
        {pickerOpen && (
          <div className="glass absolute left-0 z-20 mt-1 flex gap-1 rounded-lg p-1.5">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => toggle(emoji)}
                className="rounded-md px-1.5 py-0.5 text-sm transition hover:bg-off-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

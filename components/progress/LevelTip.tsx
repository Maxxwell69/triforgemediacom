"use client";

import type { ReactNode } from "react";

function tone(current: boolean, reached: boolean) {
  if (current) return "ring-2 ring-orange shadow-[0_0_22px_rgba(253,72,2,0.45)]";
  if (reached) return "";
  return "opacity-45";
}

export default function LevelTip({
  title,
  description,
  xpRequired,
  current,
  reached,
  tip = "above",
  className = "",
  children,
}: {
  title: string;
  description?: string | null;
  xpRequired?: number | null;
  current: boolean;
  reached: boolean;
  tip?: "above" | "below";
  className?: string;
  children: ReactNode;
}) {
  const xp =
    typeof xpRequired === "number"
      ? xpRequired === 0
        ? "0 XP to start"
        : `${xpRequired.toLocaleString()} XP`
      : null;

  return (
    <div
      className={`group relative w-full cursor-default transition duration-200 hover:z-20 hover:opacity-100 hover:shadow-[0_0_28px_rgba(253,72,2,0.55)] hover:ring-2 hover:ring-orange ${tone(
        current,
        reached
      )} ${className}`}
    >
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-30 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-orange/40 bg-charcoal px-3 py-2.5 opacity-0 shadow-[0_8px_28px_rgba(0,0,0,0.55)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
          tip === "below" ? "top-full mt-2" : "bottom-full mb-2"
        }`}
      >
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-orange">{title}</p>
        {xp ? <p className="mt-0.5 font-body text-[11px] text-off-white/55">{xp}</p> : null}
        {description ? <p className="mt-1 font-body text-xs leading-relaxed text-off-white/80">{description}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type InlineMultiSelectOption = {
  id: string;
  label: string;
  color?: string;
  icon?: string;
};

/**
 * Small "toggle a set of checkboxes" dropdown used inline in admin lists
 * (groups/tags/badges per user, etc). Renders its floating panel into a
 * portal on document.body, positioned via the trigger's bounding rect,
 * instead of `position: absolute` inside the row. Each row is a `.glass`
 * card with `backdrop-filter`, which creates its own CSS stacking context —
 * an absolutely-positioned panel nested inside one row can never paint above
 * a *later* row (a sibling stacking context), so it visually bleeds/ghosts
 * into whatever's below it. Portaling to <body> sidesteps that entirely.
 */
export default function InlineMultiSelect({
  label,
  options,
  selectedIds,
  onToggle,
  disabled,
}: {
  label: string;
  options: InlineMultiSelectOption[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 224; // w-56
      setCoords({
        top: rect.bottom + 6,
        left: Math.min(Math.max(8, rect.right - panelWidth), window.innerWidth - panelWidth - 8),
      });
    }
    updatePosition();

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (options.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
      >
        {label}
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left }}
            className="glass fixed z-50 flex w-56 flex-col gap-1.5 rounded-xl p-3 shadow-xl"
          >
            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-2 font-body text-xs text-off-white/80"
              >
                <input
                  type="checkbox"
                  defaultChecked={selectedIds.includes(opt.id)}
                  disabled={disabled}
                  onChange={(e) => onToggle(opt.id, e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-off-white/30 bg-transparent accent-orange"
                />
                {opt.color && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
              </label>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

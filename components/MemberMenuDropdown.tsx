"use client";

import { useState, type ReactNode } from "react";

export default function MemberMenuDropdown({
  parent,
  children,
}: {
  parent: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center gap-0.5">
        <div className="min-w-0 flex-1">{parent}</div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Collapse submenu" : "Expand submenu"}
          className="shrink-0 rounded-md px-1.5 py-1 font-body text-xs text-off-white/45 transition hover:bg-off-white/10 hover:text-off-white/80"
        >
          {open ? "▾" : "▸"}
        </button>
      </div>
      {open ? (
        <div className="ml-3 mt-0.5 flex w-full flex-col border-l border-off-white/15 pl-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

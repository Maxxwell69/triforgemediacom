"use client";

import { useTransition } from "react";

export default function ProgressionToggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: (next: boolean) => Promise<void>;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(e) => start(() => onToggle(e.target.checked))}
        className="h-4 w-4 accent-orange"
      />
      {label}
    </label>
  );
}

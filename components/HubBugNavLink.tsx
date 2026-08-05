"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 py-0.5 font-body text-[10px] font-bold leading-none text-white"
      aria-label={`${count} new Hub Bug${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function HubBugNavLink({ initialCount = 0 }: { initialCount?: number }) {
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);
  const onBoard = pathname === "/bugs" || pathname.startsWith("/bugs?");
  const onAdmin = pathname === "/admin/bugs" || pathname.startsWith("/admin/bugs/");
  const isActive = onBoard || onAdmin;

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/bugs/unread");
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") setCount(data.count);
      } catch {
        // ignore transient errors
      }
    }

    void load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Clear badge while viewing Hub Bug (member board or admin queue).
  useEffect(() => {
    if (isActive) setCount(0);
  }, [isActive]);

  return (
    <Link
      href="/bugs"
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-body text-sm transition ${
        onBoard
          ? "bg-off-white/10 text-off-white"
          : count > 0
            ? "font-semibold text-off-white hover:bg-off-white/5"
            : "text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90"
      }`}
    >
      <span>Hub Bug</span>
      <UnreadBadge count={isActive ? 0 : count} />
    </Link>
  );
}

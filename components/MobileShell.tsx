"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";

export default function MobileShell({
  sidebar,
  children,
  showAdminFab = false,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  showAdminFab?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isWebinarRoom = /\/webinars\/[^/]+\/room/.test(pathname);
  // FAB sits over the webinar people/chat panel on phones — keep it in the drawer only.
  const adminFabVisible = showAdminFab && !isWebinarRoom;

  // Close the drawer whenever the route changes (e.g. tapping a nav link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div
      className={`flex flex-col md:flex-row ${
        isWebinarRoom ? "h-dvh max-h-dvh overflow-hidden" : "min-h-screen"
      }`}
    >
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-off-white/10 bg-charcoal/95 px-4 py-3 backdrop-blur md:hidden print:hidden">
        <Logo height={20} href="/home" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-off-white/15 p-2 text-off-white/70 transition hover:border-cyan/40 hover:text-off-white"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/70 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-off-white/10 bg-charcoal px-4 py-5 transition-transform duration-200 ease-out print:hidden md:sticky md:top-0 md:h-screen md:translate-x-0 md:bg-off-white/[0.02] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="mb-4 self-end text-off-white/50 transition hover:text-off-white md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M3 3l12 12M15 3L3 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {sidebar}
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          isWebinarRoom ? "min-h-0 overflow-hidden" : ""
        }`}
      >
        {children}
      </div>

      {adminFabVisible && (
        <Link
          href="/admin"
          aria-label="Go to admin panel"
          className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full border border-cyan/40 bg-charcoal/95 px-4 py-2.5 font-body text-sm font-semibold text-cyan shadow-glow-cyan backdrop-blur transition hover:bg-cyan/10 md:hidden print:hidden"
        >
          <span aria-hidden="true">🛠️</span>
          Admin
        </Link>
      )}
    </div>
  );
}

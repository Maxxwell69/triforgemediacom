"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ADMIN_NAV_SECTIONS,
  isAdminLinkActive,
  isAdminSectionActive,
  type AdminNavSection,
} from "@/lib/adminNav";

export default function AdminNav({
  sections = ADMIN_NAV_SECTIONS,
  showCreateHub = false,
}: {
  sections?: AdminNavSection[];
  showCreateHub?: boolean;
}) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) {
        setOpenId(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const dashActive = pathname === "/admin";

  return (
    <nav
      ref={navRef}
      className="flex max-w-full flex-wrap items-center gap-1 font-body text-sm"
    >
      <Link
        href="/admin"
        className={`rounded-lg px-3 py-1.5 transition ${
          dashActive
            ? "bg-off-white/10 text-off-white"
            : "text-off-white/50 hover:text-off-white/80"
        }`}
      >
        Dashboard
      </Link>
      {showCreateHub ? (
        <Link
          href="/superadmin"
          className={`rounded-lg px-3 py-1.5 transition ${
            pathname.startsWith("/superadmin")
              ? "bg-off-white/10 text-off-white"
              : "text-off-white/50 hover:text-off-white/80"
          }`}
        >
          Create Hub
        </Link>
      ) : null}

      {sections.map((section) => {
        const sectionActive = isAdminSectionActive(pathname, section);
        const open = openId === section.id;

        // Single-link sections jump straight there (no empty dropdown)
        if (section.links.length === 1) {
          const link = section.links[0];
          const active = isAdminLinkActive(pathname, link.href);
          return (
            <Link
              key={section.id}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 transition ${
                active
                  ? "bg-off-white/10 text-off-white"
                  : "text-off-white/50 hover:text-off-white/80"
              }`}
            >
              {section.label}
            </Link>
          );
        }

        return (
          <div key={section.id} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpenId(open ? null : section.id)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
                sectionActive || open
                  ? "bg-off-white/10 text-off-white"
                  : "text-off-white/50 hover:text-off-white/80"
              }`}
            >
              {section.label}
              <span className="text-[10px] text-off-white/40" aria-hidden>
                {open ? "▴" : "▾"}
              </span>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-off-white/15 bg-charcoal/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                {section.links.map((link) => {
                  const active = isAdminLinkActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`block rounded-lg px-3 py-2 transition ${
                        active
                          ? "bg-off-white/10 text-off-white"
                          : "text-off-white/70 hover:bg-off-white/5 hover:text-off-white"
                      }`}
                    >
                      <span className="block font-medium">{link.label}</span>
                      {link.description && (
                        <span className="mt-0.5 block text-[11px] text-off-white/40">
                          {link.description}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const LEAVE_MESSAGE =
  "Leave this webinar? If you're presenting, viewers may lose you from stage.";

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function resolveAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a[href]");
}

function shouldWarnForHref(href: string, currentPath: string): boolean {
  try {
    const url = new URL(href, window.location.origin);
    // External / download / hash-only — beforeunload or browser handles most;
    // still warn on same-origin navigations that leave the room.
    if (url.origin !== window.location.origin) return true;
    if (url.pathname === currentPath && url.search === window.location.search) {
      return false;
    }
    // Stay inside the same webinar room (query-only changes).
    if (url.pathname === currentPath) return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * Warn before closing the tab / navigating away from the room.
 * Uses beforeunload for hard exits, capture-phase link clicks for in-app nav,
 * and confirm() for the Leave control.
 */
export function useWebinarLeaveGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    }

    function onDocumentClick(e: MouseEvent) {
      if (isModifiedClick(e)) return;
      const anchor = resolveAnchor(e.target);
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      if (!shouldWarnForHref(href, window.location.pathname)) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function onPopState() {
      // History already changed — offer to stay by going forward again.
      if (!window.confirm(LEAVE_MESSAGE)) {
        history.go(1);
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);
}

export function confirmLeaveWebinar(): boolean {
  return window.confirm(LEAVE_MESSAGE);
}

export function WebinarLeaveLink({
  href,
  warn,
  children,
  className,
}: {
  href: string;
  warn: boolean;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (warn && !confirmLeaveWebinar()) return;
        router.push(href);
      }}
    >
      {children}
    </button>
  );
}

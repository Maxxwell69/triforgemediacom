"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const LEAVE_MESSAGE =
  "You're about to leave this webinar. Hosts who leave may drop off stage for viewers — stay if you're still presenting.";

/**
 * Warn hosts before closing the tab / navigating away from the room.
 * Uses beforeunload for hard exits, and confirm() for in-app Leave.
 */
export function useWebinarLeaveGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
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

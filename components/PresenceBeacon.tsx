"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 45_000;

/**
 * Pings /api/presence while the community shell is open so other members
 * see a green online dot. First beat fires immediately on mount.
 */
export default function PresenceBeacon() {
  useEffect(() => {
    let cancelled = false;

    async function beat() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        await fetch("/api/presence", { method: "POST" });
      } catch {
        // best-effort
      }
    }

    void beat();
    const id = window.setInterval(() => void beat(), HEARTBEAT_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void beat();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

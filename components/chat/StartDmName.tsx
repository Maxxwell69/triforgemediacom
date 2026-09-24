"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";

export default function StartDmName({
  userId,
  currentUserId,
  canStartDm,
  className,
  children,
  title,
}: {
  userId: string;
  currentUserId: string;
  canStartDm: boolean;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const profileHref = `/members/${userId}`;
  const shouldDm = canStartDm && userId !== currentUserId;

  async function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!shouldDm) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        conversationId?: string;
      };
      if (res.ok && data.conversationId) {
        router.push(`/dms/${data.conversationId}`);
        return;
      }
      router.push(profileHref);
    } catch {
      router.push(profileHref);
    } finally {
      setBusy(false);
    }
  }

  return (
    <a
      href={profileHref}
      onClick={onClick}
      className={`${className ?? ""} ${busy ? "pointer-events-none opacity-60" : ""}`}
      title={shouldDm ? title ?? "Send a direct message" : title}
    >
      {children}
    </a>
  );
}

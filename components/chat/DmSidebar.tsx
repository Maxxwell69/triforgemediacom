"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DmSidebarRow } from "@/lib/dmSidebar";
import DmPeopleAvatars from "@/components/chat/DmPeopleAvatars";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 py-0.5 font-body text-[10px] font-bold leading-none text-white"
      aria-label={`${count} unread direct message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function DmSidebar({
  initialConversations,
}: {
  initialConversations: DmSidebarRow[];
}) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dms/sidebar");
        if (!res.ok) return;
        const data = (await res.json()) as { conversations?: DmSidebarRow[] };
        if (!cancelled && data.conversations) setConversations(data.conversations);
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

  useEffect(() => {
    const match = pathname.match(/^\/dms\/([^/]+)/);
    if (!match) return;
    const conversationId = match[1];
    setConversations((prev) =>
      prev.map((row) => (row.id === conversationId ? { ...row, unreadCount: 0 } : row))
    );
  }, [pathname]);

  const totalUnread = conversations.reduce((sum, row) => sum + row.unreadCount, 0);
  const onInbox = pathname === "/dms";

  return (
    <nav className="mb-4 border-t border-off-white/10 pt-4">
      <div className="mb-1 flex items-center justify-between px-3">
        <Link
          href="/dms"
          className={`font-body text-[11px] font-semibold uppercase tracking-wider transition hover:text-off-white/70 ${
            onInbox || totalUnread > 0 ? "text-off-white/70" : "text-off-white/35"
          }`}
        >
          Direct Messages
        </Link>
        <Link
          href="/dms"
          title="Find or start a conversation"
          className="flex h-5 w-5 items-center justify-center rounded text-off-white/40 transition hover:bg-off-white/10 hover:text-off-white"
        >
          <span className="font-body text-base leading-none" aria-hidden>
            +
          </span>
          <span className="sr-only">Start a direct message</span>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <Link
          href="/dms"
          className="block rounded-lg px-3 py-2 font-body text-sm text-off-white/40 transition hover:bg-off-white/5 hover:text-off-white/70"
        >
          Find or start a conversation
        </Link>
      ) : (
        conversations.map((row) => {
          const href = `/dms/${row.id}`;
          const isActive = pathname === href;
          const count = isActive ? 0 : row.unreadCount;
          return (
            <Link
              key={row.id}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 font-body text-sm transition ${
                isActive
                  ? "bg-off-white/10 text-off-white"
                  : count > 0
                    ? "font-semibold text-off-white hover:bg-off-white/5"
                    : "text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90"
              }`}
            >
              <DmPeopleAvatars people={row.people} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{row.title}</span>
                {row.people.length > 1 ? (
                  <span className="block truncate font-body text-[10px] font-normal text-off-white/35">
                    {row.people.length} members
                  </span>
                ) : null}
              </span>
              <UnreadBadge count={count} />
            </Link>
          );
        })
      )}
    </nav>
  );
}

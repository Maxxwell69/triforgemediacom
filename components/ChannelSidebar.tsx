"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ChannelListItem = {
  id: string;
  name: string;
  unreadCount?: number;
};

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto inline-flex min-w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 py-0.5 font-body text-[10px] font-bold leading-none text-white"
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function ChannelSidebar({
  channels: initialChannels,
  spaceName,
}: {
  channels: ChannelListItem[];
  spaceName?: string | null;
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of initialChannels) init[c.id] = c.unreadCount ?? 0;
    return init;
  });

  useEffect(() => {
    const init: Record<string, number> = {};
    for (const c of initialChannels) init[c.id] = c.unreadCount ?? 0;
    setUnread(init);
  }, [initialChannels]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/channels/unread");
        if (!res.ok) return;
        const data = (await res.json()) as { counts: Record<string, number> };
        if (!cancelled && data.counts) setUnread(data.counts);
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

  // Clear badge for the channel you're currently viewing.
  useEffect(() => {
    const match = pathname.match(/^\/channels\/([^/]+)/);
    if (!match) return;
    const channelId = match[1];
    setUnread((prev) => (prev[channelId] ? { ...prev, [channelId]: 0 } : prev));
  }, [pathname]);

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 pb-2 font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
        {spaceName ? `${spaceName} channels` : "Channels"}
      </p>
      {initialChannels.length === 0 && (
        <p className="px-3 font-body text-sm text-off-white/40">No channels yet</p>
      )}
      {initialChannels.map((channel) => {
        const href = `/channels/${channel.id}`;
        const isActive = pathname === href;
        const count = unread[channel.id] ?? 0;
        return (
          <Link
            key={channel.id}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-body text-sm transition ${
              isActive
                ? "bg-off-white/10 text-off-white"
                : count > 0
                  ? "font-semibold text-off-white hover:bg-off-white/5"
                  : "text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90"
            }`}
          >
            <span className="min-w-0 truncate"># {channel.name}</span>
            <UnreadBadge count={isActive ? 0 : count} />
          </Link>
        );
      })}
    </nav>
  );
}

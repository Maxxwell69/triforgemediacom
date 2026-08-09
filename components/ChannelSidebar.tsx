"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ChannelListItem = {
  id: string;
  name: string;
  unreadCount?: number;
};

export type ChannelSpaceHeader = {
  id: string;
  name: string;
  color: string;
  imageUrl: string | null;
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
  space,
}: {
  channels: ChannelListItem[];
  space?: ChannelSpaceHeader | null;
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of initialChannels) init[c.id] = c.unreadCount ?? 0;
    return init;
  });
  const [flashKey, setFlashKey] = useState(0);

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

  // Flash the space header + channel list when the active group changes.
  useEffect(() => {
    if (!space?.id) return;
    setFlashKey((k) => k + 1);
  }, [space?.id]);

  return (
    <nav
      key={space?.id ?? "no-space"}
      className="flex flex-col gap-0.5 animate-[hubFadeUp_0.28s_ease-out_both]"
    >
      {space ? (
        <Link
          key={`space-flash-${flashKey}`}
          href={`/groups/${space.id}`}
          className="group-switch-flash mb-2 flex items-center gap-2.5 rounded-xl border border-off-white/10 bg-off-white/[0.04] px-2.5 py-2.5 transition hover:border-cyan/30 hover:bg-off-white/[0.07]"
        >
          {space.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={space.imageUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-off-white/15"
            />
          ) : (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-off-white/20 font-display text-sm text-off-white/80"
              style={{ backgroundColor: space.color }}
              aria-hidden
            >
              {space.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-semibold text-off-white">
              {space.name}
            </p>
            <p className="font-body text-[11px] uppercase tracking-wider text-off-white/40">
              Channels
            </p>
          </div>
        </Link>
      ) : (
        <p className="px-3 pb-2 font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
          Channels
        </p>
      )}
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

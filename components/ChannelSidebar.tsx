"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ChannelListItem = {
  id: string;
  name: string;
};

export default function ChannelSidebar({ channels }: { channels: ChannelListItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 pb-2 font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
        Channels
      </p>
      {channels.length === 0 && (
        <p className="px-3 font-body text-sm text-off-white/40">No channels yet</p>
      )}
      {channels.map((channel) => {
        const href = `/channels/${channel.id}`;
        const isActive = pathname === href;
        return (
          <Link
            key={channel.id}
            href={href}
            className={`rounded-lg px-3 py-2 font-body text-sm transition ${
              isActive
                ? "bg-off-white/10 text-off-white"
                : "text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90"
            }`}
          >
            # {channel.name}
          </Link>
        );
      })}
    </nav>
  );
}

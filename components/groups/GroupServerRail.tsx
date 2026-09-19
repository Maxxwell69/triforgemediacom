"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setActiveGroupAction } from "@/app/(community)/groups/activeGroupActions";

function isWebinarRoomPath(pathname: string) {
  return /\/webinars\/[^/]+\/room/.test(pathname);
}

export type ServerRailSpace = {
  id: string;
  name: string;
  color: string;
  imageUrl: string | null;
  isHome: boolean;
  unreadCount?: number;
};

function UnreadPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="pointer-events-none absolute -bottom-1 -right-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-body text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-[#070707]"
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function GroupServerRail({
  spaces,
  activeGroupId,
  showDm = false,
  dmActive = false,
  dmUnread = 0,
}: {
  spaces: ServerRailSpace[];
  activeGroupId: string | null;
  showDm?: boolean;
  dmActive?: boolean;
  dmUnread?: number;
}) {
  const pathname = usePathname();
  const inWebinarRoom = isWebinarRoomPath(pathname);
  const [pending, startTransition] = useTransition();
  const [unreadByGroup, setUnreadByGroup] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const s of spaces) init[s.id] = s.unreadCount ?? 0;
    return init;
  });

  useEffect(() => {
    const init: Record<string, number> = {};
    for (const s of spaces) init[s.id] = s.unreadCount ?? 0;
    setUnreadByGroup(init);
  }, [spaces]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/channels/unread");
        if (!res.ok) return;
        const data = (await res.json()) as { byGroup?: Record<string, number> };
        if (!cancelled && data.byGroup) setUnreadByGroup(data.byGroup);
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

  if (spaces.length === 0 && !showDm) return null;

  return (
    <nav
      aria-label="Groups"
      className="hub-groups flex h-full w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-off-white/10 py-3"
    >
      {spaces.map((space, index) => {
        const active = space.id === activeGroupId;
        const showHomeDivider = space.isHome && spaces.some((s, i) => i > index && !s.isHome);
        const unreadCount = active ? 0 : unreadByGroup[space.id] ?? space.unreadCount ?? 0;

        return (
          <div key={space.id} className="flex w-full flex-col items-center gap-2">
            <div className="group relative flex w-full justify-center">
              <span
                className={`absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-off-white transition-all ${
                  active
                    ? "h-10 opacity-100"
                    : "h-0 opacity-0 group-hover:h-5 group-hover:opacity-70"
                }`}
                aria-hidden
              />
              <div className="relative h-12 w-12 shrink-0">
                <Link
                  href={`/groups/${space.id}`}
                  title={space.name}
                  aria-label={
                    unreadCount > 0
                      ? `${space.name}, ${unreadCount} unread`
                      : space.name
                  }
                  aria-current={active ? "true" : undefined}
                  aria-disabled={pending || (active && !inWebinarRoom) || undefined}
                  onClick={(e) => {
                    // Stay put when this space is already active — except in a
                    // webinar room, where the icon must navigate (and warn) so
                    // you can leave the stage.
                    if (pending || (active && !inWebinarRoom)) {
                      e.preventDefault();
                      return;
                    }
                    startTransition(async () => {
                      await setActiveGroupAction(space.id);
                    });
                  }}
                  className={`block h-full w-full overflow-hidden transition-[border-radius,background-color,box-shadow] duration-200 ease-out ${
                    active
                      ? "rounded-2xl shadow-[0_0_0_1px_rgba(0,212,255,0.35)]"
                      : "rounded-[1.5rem] hover:rounded-2xl"
                  } ${pending ? "pointer-events-none opacity-60" : ""}`}
                  style={
                    space.imageUrl
                      ? undefined
                      : { backgroundColor: space.color || "#FD4802" }
                  }
                >
                  {space.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={space.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-display text-lg tracking-wide text-off-white">
                      {space.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </Link>
                <UnreadPill count={unreadCount} />
              </div>

              {/* Hover label (Discord-style) */}
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-charcoal px-3 py-1.5 font-body text-sm font-semibold text-off-white shadow-lg ring-1 ring-off-white/15 group-hover:block">
                {space.name}
                {space.isHome ? (
                  <span className="ml-1.5 text-xs font-normal text-cyan">Home</span>
                ) : null}
                {unreadCount > 0 ? (
                  <span className="ml-1.5 text-xs font-normal text-red-400">
                    {unreadCount > 99 ? "99+" : unreadCount} new
                  </span>
                ) : null}
              </span>
            </div>

            {showHomeDivider ? (
              <div className="my-0.5 h-0.5 w-8 rounded-full bg-off-white/15" aria-hidden />
            ) : null}
          </div>
        );
      })}

      {showDm && (
        <div className="group relative flex w-full flex-col items-center gap-2 pt-1">
          <div className="h-0.5 w-8 rounded-full bg-off-white/15" aria-hidden />
          <div className="relative flex w-full justify-center">
            <span
              className={`absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-off-white transition-all ${
                dmActive ? "h-10 opacity-100" : "h-0 opacity-0 group-hover:h-5 group-hover:opacity-70"
              }`}
              aria-hidden
            />
            <div className="relative h-12 w-12 shrink-0">
              <Link
                href="/dms"
                title="Direct Messages"
                aria-label={dmUnread > 0 ? `Direct Messages, ${dmUnread} unread` : "Direct Messages"}
                aria-current={dmActive ? "true" : undefined}
                className={`flex h-full w-full flex-col items-center justify-center transition-[border-radius,background-color,box-shadow] duration-200 ease-out ${
                  dmActive
                    ? "rounded-2xl bg-cyan/20 shadow-[0_0_0_1px_rgba(0,212,255,0.35)]"
                    : "rounded-[1.5rem] bg-off-white/5 hover:rounded-2xl hover:bg-off-white/10"
                }`}
              >
                <svg className="h-5 w-5 text-off-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 6.5h14v9.2H9.2L5 19.5V6.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-display text-[10px] tracking-wide text-off-white/80">DM</span>
              </Link>
              <UnreadPill count={dmActive ? 0 : dmUnread} />
            </div>
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-charcoal px-3 py-1.5 font-body text-sm font-semibold text-off-white shadow-lg ring-1 ring-off-white/15 group-hover:block">
              Direct Messages
              {dmUnread > 0 ? (
                <span className="ml-1.5 text-xs font-normal text-red-400">
                  {dmUnread > 99 ? "99+" : dmUnread} new
                </span>
              ) : null}
            </span>
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col items-center gap-2 pt-2">
        <div className="h-0.5 w-8 rounded-full bg-off-white/15" aria-hidden />
        <Link
          href="/groups"
          title="All groups"
          aria-label="All groups"
          className="flex h-12 w-12 items-center justify-center rounded-[1.5rem] bg-off-white/5 font-display text-xl text-cyan transition hover:rounded-2xl hover:bg-cyan/15 hover:text-cyan"
        >
          +
        </Link>
      </div>
    </nav>
  );
}

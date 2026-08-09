"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setActiveGroupAction } from "@/app/(community)/groups/activeGroupActions";

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
}: {
  spaces: ServerRailSpace[];
  activeGroupId: string | null;
}) {
  const router = useRouter();
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

  if (spaces.length === 0) return null;

  return (
    <nav
      aria-label="Groups"
      className="flex w-full shrink-0 items-center gap-2 overflow-x-auto border-b border-off-white/10 bg-[#070707] px-3 py-2.5"
    >
      {spaces.map((space, index) => {
        const active = space.id === activeGroupId;
        const showHomeDivider = space.isHome && spaces.some((s, i) => i > index && !s.isHome);
        const unreadCount = active ? 0 : unreadByGroup[space.id] ?? space.unreadCount ?? 0;

        return (
          <div key={space.id} className="flex shrink-0 items-center gap-2">
            <div className="group relative flex flex-col items-center">
              <span
                className={`absolute -top-1.5 h-1 w-1 rounded-full bg-off-white transition-all ${
                  active ? "w-5 opacity-100" : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-70"
                }`}
                aria-hidden
              />
              <div className="relative h-10 w-10 shrink-0">
                <button
                  type="button"
                  title={space.name}
                  aria-label={
                    unreadCount > 0
                      ? `${space.name}, ${unreadCount} unread`
                      : space.name
                  }
                  aria-current={active ? "true" : undefined}
                  disabled={pending}
                  onClick={() => {
                    if (active) return;
                    startTransition(async () => {
                      await setActiveGroupAction(space.id);
                      router.refresh();
                    });
                  }}
                  className={`h-full w-full overflow-hidden transition-[border-radius,background-color,box-shadow] duration-200 ease-out ${
                    active
                      ? "rounded-xl shadow-[0_0_0_1px_rgba(0,212,255,0.35)]"
                      : "rounded-[1.25rem] hover:rounded-xl"
                  } ${pending ? "opacity-60" : ""}`}
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
                    <span className="flex h-full w-full items-center justify-center font-display text-base tracking-wide text-off-white">
                      {space.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
                <UnreadPill count={unreadCount} />
              </div>

              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-charcoal px-2.5 py-1 font-body text-xs font-semibold text-off-white shadow-lg ring-1 ring-off-white/15 group-hover:block">
                {space.name}
                {space.isHome ? (
                  <span className="ml-1 text-[10px] font-normal text-cyan">Home</span>
                ) : null}
              </span>
            </div>

            {showHomeDivider ? (
              <div className="mx-0.5 h-8 w-0.5 shrink-0 rounded-full bg-off-white/15" aria-hidden />
            ) : null}
          </div>
        );
      })}

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-1">
        <div className="h-8 w-0.5 rounded-full bg-off-white/15" aria-hidden />
        <Link
          href="/groups"
          title="All groups"
          aria-label="All groups"
          className="flex h-10 w-10 items-center justify-center rounded-[1.25rem] bg-off-white/5 font-display text-lg text-cyan transition hover:rounded-xl hover:bg-cyan/15 hover:text-cyan"
        >
          +
        </Link>
      </div>
    </nav>
  );
}

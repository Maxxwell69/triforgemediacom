"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setActiveGroupAction } from "@/app/(community)/groups/activeGroupActions";

export type SpaceOption = {
  id: string;
  name: string;
  color: string;
  imageUrl: string | null;
  isHome: boolean;
};

export default function GroupSpaceSwitcher({
  spaces,
  activeGroupId,
}: {
  spaces: SpaceOption[];
  activeGroupId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (spaces.length <= 1) return null;

  return (
    <div className="mb-3 px-1">
      <p className="px-2 pb-1.5 font-body text-xs font-semibold uppercase tracking-wider text-off-white/40">
        Space
      </p>
      <div className="flex flex-col gap-0.5">
        {spaces.map((space) => {
          const active = space.id === activeGroupId;
          return (
            <button
              key={space.id}
              type="button"
              disabled={pending || active}
              onClick={() => {
                startTransition(async () => {
                  await setActiveGroupAction(space.id);
                  router.push(`/groups/${space.id}`);
                  router.refresh();
                });
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left font-body text-sm transition ${
                active
                  ? "bg-off-white/10 text-off-white"
                  : "text-off-white/60 hover:bg-off-white/5 hover:text-off-white/90 disabled:opacity-50"
              }`}
            >
              {space.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={space.imageUrl}
                  alt=""
                  className="h-5 w-5 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span
                  className="h-5 w-5 shrink-0 rounded-md border border-off-white/20"
                  style={{ backgroundColor: space.color }}
                />
              )}
              <span className="min-w-0 truncate">
                {space.name}
                {space.isHome ? (
                  <span className="ml-1 text-xs text-cyan">Home</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

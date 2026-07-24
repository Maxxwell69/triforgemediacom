"use client";

import { useState, useTransition } from "react";
import { setGroupChannels } from "@/app/admin/groups/actions";

type Channel = { id: string; name: string };

export default function GroupChannelsForm({
  groupId,
  allChannels,
  selectedChannelIds,
}: {
  groupId: string;
  allChannels: Channel[];
  selectedChannelIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(selectedChannelIds);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <div className="flex flex-col gap-3">
      {allChannels.length === 0 && (
        <p className="font-body text-sm text-off-white/40">No channels created yet.</p>
      )}
      <div className="flex flex-col gap-1">
        {allChannels.map((channel) => (
          <label
            key={channel.id}
            className="flex items-center gap-2 rounded-lg border border-off-white/10 px-3 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/30"
          >
            <input
              type="checkbox"
              checked={selected.includes(channel.id)}
              onChange={() => toggle(channel.id)}
              className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
            />
            # {channel.name}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await setGroupChannels(groupId, selected);
            setSaved(true);
          })
        }
        className="self-start rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Saving..." : saved ? "Saved" : "Save channels"}
      </button>
    </div>
  );
}

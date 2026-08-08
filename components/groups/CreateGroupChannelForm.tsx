"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupChannel } from "@/app/(community)/groups/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function CreateGroupChannelForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      action={(formData) => {
        startTransition(async () => {
          const result = await createGroupChannel(groupId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }
          setError(null);
          if (result.channelId) {
            router.push(`/channels/${result.channelId}`);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          name="name"
          required
          placeholder="channel-name"
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
        >
          {isPending ? "Creating…" : "Create channel"}
        </button>
      </div>
      <input
        name="description"
        placeholder="Optional description"
        className={fieldClass}
      />
      {error && <p className="font-body text-sm text-orange">{error}</p>}
    </form>
  );
}

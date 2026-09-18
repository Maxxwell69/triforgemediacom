"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupChannel } from "@/app/(community)/groups/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function CreateGroupChannelForm({
  groupId,
  voiceAvailable,
  stayOnPage,
}: {
  groupId: string;
  voiceAvailable?: boolean;
  stayOnPage?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await createGroupChannel(groupId, formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        form.reset();
        if (stayOnPage) {
          setSuccess(`Created #${result.name ?? "channel"}. It should appear in the list below.`);
          router.refresh();
          return;
        }
        if (result.channelId) {
          router.push(`/channels/${result.channelId}`);
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create that channel.");
      }
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          name="name"
          required
          minLength={2}
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
      {voiceAvailable && (
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="hasVoice"
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Enable hop-in voice
        </label>
      )}
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      {success && <p className="font-body text-sm text-cyan">{success}</p>}
    </form>
  );
}

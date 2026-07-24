"use client";

import { useState, useTransition } from "react";
import { updateChannel, deleteChannel } from "@/app/admin/channels/actions";
import { ROLE_LABELS } from "@/lib/rbac";
import { roleOptions } from "@/lib/validations/channel";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  minRole: keyof typeof ROLE_LABELS;
  messageCount: number;
  groupNames: string[];
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function ChannelRow({ channel }: { channel: Channel }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateChannel(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-xl p-4"
      >
        <input type="hidden" name="id" value={channel.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" defaultValue={channel.name} required className={fieldClass} />
          <select
            name="minRole"
            defaultValue={channel.minRole}
            required
            className={`${fieldClass} sm:w-40`}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="description"
          defaultValue={channel.description ?? ""}
          rows={2}
          className={fieldClass}
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="font-body text-sm text-off-white/50 hover:text-off-white"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="glass flex items-center justify-between gap-4 rounded-xl p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-body text-sm font-medium text-off-white"># {channel.name}</p>
          <span className="rounded bg-orange/15 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
            {ROLE_LABELS[channel.minRole]}+
          </span>
          {channel.groupNames.map((name) => (
            <span
              key={name}
              className="rounded-full border border-cyan/30 px-2 py-0.5 font-body text-[10px] text-cyan"
            >
              {name}
            </span>
          ))}
        </div>
        {channel.description && (
          <p className="mt-1 truncate font-body text-xs text-off-white/40">
            {channel.description}
          </p>
        )}
        <p className="mt-1 font-body text-xs text-off-white/30">
          {channel.messageCount} message{channel.messageCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (
              !confirm(
                `Delete #${channel.name}? This deletes all its messages and can't be undone.`
              )
            )
              return;
            startTransition(async () => {
              await deleteChannel(channel.id);
            });
          }}
          className="rounded-lg border border-orange/40 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

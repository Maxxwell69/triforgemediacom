"use client";

import { useState, useTransition } from "react";
import { createGroupInviteLink } from "@/app/admin/groups/actions";

export default function GroupInvitePanel({ groupId }: { groupId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-off-white/50">
        Create a link members can use to join. Optionally lock it to one email.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Optional email lock"
          className="flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await createGroupInviteLink(groupId, email || undefined);
              if (result.error) {
                setError(result.error);
                setUrl(null);
              } else {
                setError(null);
                setUrl(result.url ?? null);
              }
            })
          }
          className="rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110 disabled:opacity-40"
        >
          {isPending ? "Creating…" : "Create invite link"}
        </button>
      </div>
      {error && <p className="font-body text-sm text-orange">{error}</p>}
      {url && (
        <div className="rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2">
          <p className="font-body text-xs text-off-white/50">Invite URL</p>
          <p className="break-all font-body text-sm text-cyan">{url}</p>
        </div>
      )}
    </div>
  );
}

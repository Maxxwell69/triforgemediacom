"use client";

import { useState, useTransition } from "react";
import {
  regenerateWebinarExternalInviteAction,
  setWebinarExternalSignupAction,
} from "@/app/admin/webinars/actions";

type Guest = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  joinedAt: string | null;
};

export default function AdminWebinarExternalSignup({
  webinarId,
  enabled,
  inviteUrl,
  guests,
}: {
  webinarId: string;
  enabled: boolean;
  inviteUrl: string | null;
  guests: Guest[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-off-white/10 bg-charcoal/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg tracking-wide text-off-white/90">
            Outside meeting spot
          </p>
          <p className="mt-1 max-w-xl font-body text-xs text-off-white/45">
            Secure page for people outside the network to sign up for this webinar only.
            Share the invite link — it is unguessable and not listed publicly.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await setWebinarExternalSignupAction(webinarId, !enabled);
              if (result.error) setError(result.error);
            });
          }}
          className={`rounded-lg px-3 py-1.5 font-body text-sm font-semibold transition disabled:opacity-60 ${
            enabled
              ? "border border-off-white/20 text-off-white/70 hover:bg-off-white/5"
              : "bg-orange text-charcoal shadow-glow hover:brightness-110"
          }`}
        >
          {pending ? "Saving…" : enabled ? "Disable page" : "Enable page"}
        </button>
      </div>

      {enabled && inviteUrl && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            readOnly
            value={inviteUrl}
            className="min-w-0 flex-1 truncate rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-xs text-cyan outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-sm text-cyan transition hover:bg-cyan/10"
            >
              {copied ? "Copied" : "Copy invite link"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm("Regenerate invite link? Old links will stop working.")) return;
                setError(null);
                startTransition(async () => {
                  const result = await regenerateWebinarExternalInviteAction(webinarId);
                  if (result.error) setError(result.error);
                });
              }}
              className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-sm text-off-white/40 transition hover:border-orange/40 hover:text-orange disabled:opacity-60"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 font-body text-sm text-orange">{error}</p>}

      {(enabled || guests.length > 0) && (
        <div className="mt-4">
          <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
            Outside signups ({guests.length})
          </p>
          {guests.length === 0 ? (
            <p className="mt-2 font-body text-xs text-off-white/40">No registrations yet.</p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {guests.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 font-body text-xs text-off-white/70"
                >
                  <span>
                    <span className="font-semibold text-off-white/90">{g.name}</span>
                    <span className="text-off-white/40"> · {g.email}</span>
                  </span>
                  <span className="text-off-white/35">
                    {g.joinedAt
                      ? `Joined ${new Date(g.joinedAt).toLocaleString()}`
                      : `Signed up ${new Date(g.registeredAt).toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { inviteWebinarGuestsAction } from "@/app/admin/webinars/actions";

export default function AdminWebinarInvitePanel({
  webinarId,
  title,
  hubUrl,
  inviteUrl,
  externalSignupEnabled,
}: {
  webinarId: string;
  title: string;
  hubUrl: string;
  inviteUrl: string | null;
  externalSignupEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<"hub" | "public" | null>(null);

  async function copy(kind: "hub" | "public", url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  return (
    <div className="rounded-xl border border-cyan/25 bg-cyan/5 p-4">
      <p className="font-display text-lg tracking-wide text-off-white/90">Invite people</p>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Copy a link or email invites for <span className="text-off-white/70">{title}</span>.
        Hub members get the webinar page; everyone else gets a personal guest link.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {!externalSignupEnabled && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={hubUrl}
              className="min-w-0 flex-1 truncate rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-xs text-cyan outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => void copy("hub", hubUrl)}
              className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-sm text-cyan transition hover:bg-cyan/10"
            >
              {copied === "hub" ? "Copied" : "Copy hub link"}
            </button>
          </div>
        )}
        {externalSignupEnabled && inviteUrl && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={inviteUrl}
              className="min-w-0 flex-1 truncate rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-xs text-cyan outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => void copy("public", inviteUrl)}
              className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-sm text-cyan transition hover:bg-cyan/10"
            >
              {copied === "public" ? "Copied" : "Copy signup link"}
            </button>
          </div>
        )}
      </div>

      <label className="mt-3 block font-body text-xs text-off-white/50">
        Email invites
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={3}
          placeholder="one@email.com, two@email.com"
          className="mt-1 w-full rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        />
      </label>
      <button
        type="button"
        disabled={pending || !emails.trim()}
        onClick={() => {
          setError(null);
          setSentNote(null);
          startTransition(async () => {
            const result = await inviteWebinarGuestsAction(webinarId, emails);
            if (result.error) {
              setError(result.error);
              return;
            }
            const extra =
              result.failed && result.failed.length > 0
                ? ` Could not send: ${result.failed.join(", ")}`
                : "";
            setSentNote(`Sent ${result.sent} invite${result.sent === 1 ? "" : "s"}.${extra}`);
            setEmails("");
          });
        }}
        className="mt-2 rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-charcoal shadow-glow transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invites"}
      </button>
      {error && <p className="mt-2 font-body text-sm text-orange">{error}</p>}
      {sentNote && <p className="mt-2 font-body text-sm text-cyan">{sentNote}</p>}
    </div>
  );
}

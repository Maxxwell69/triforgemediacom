"use client";

import { useMemo, useState, useTransition } from "react";
import { inviteWebinarGuestsAction } from "@/app/admin/webinars/actions";

export type WebinarInviteMember = {
  id: string;
  name: string | null;
  email: string;
};

export default function AdminWebinarInvitePanel({
  webinarId,
  title,
  hubUrl,
  inviteUrl,
  externalSignupEnabled,
  members,
}: {
  webinarId: string;
  title: string;
  hubUrl: string;
  inviteUrl: string | null;
  externalSignupEnabled: boolean;
  members: WebinarInviteMember[];
}) {
  const [pending, startTransition] = useTransition();
  const [emails, setEmails] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<"hub" | "public" | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) => {
      const name = (member.name || "").toLowerCase();
      return name.includes(q) || member.email.toLowerCase().includes(q);
    });
  }, [members, query]);

  const selectedCount = selected.size;
  const canSend = selectedCount > 0 || emails.trim().length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const member of filtered) next.add(member.id);
      return next;
    });
  }

  function clearSelected() {
    setSelected(new Set());
  }

  async function copy(kind: "hub" | "public", url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  function payloadEmails() {
    const fromMembers = members
      .filter((member) => selected.has(member.id))
      .map((member) => member.email);
    return [...fromMembers, emails].filter(Boolean).join("\n");
  }

  return (
    <div className="rounded-xl border border-cyan/25 bg-cyan/5 p-4">
      <p className="font-display text-lg tracking-wide text-off-white/90">Invite people</p>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Pick hub members or paste outside emails for{" "}
        <span className="text-off-white/70">{title}</span>. Members get the webinar page;
        everyone else gets a personal guest link.
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

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
            Members ({selectedCount} selected)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectVisible}
              className="font-body text-xs text-cyan hover:underline"
            >
              Select {query.trim() ? "visible" : "all"}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={clearSelected}
                className="font-body text-xs text-off-white/45 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          className="mt-2 w-full rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        />
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-off-white/10 bg-charcoal/50 p-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-3 font-body text-xs text-off-white/40">
              {members.length === 0 ? "No active members to invite." : "No members match that search."}
            </li>
          ) : (
            filtered.map((member) => {
              const checked = selected.has(member.id);
              return (
                <li key={member.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-off-white/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(member.id)}
                      className="accent-orange"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-body text-sm text-off-white">
                        {member.name || member.email}
                      </span>
                      {member.name ? (
                        <span className="block truncate font-body text-xs text-off-white/40">
                          {member.email}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <label className="mt-3 block font-body text-xs text-off-white/50">
        Also invite by email
        <textarea
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          rows={2}
          placeholder="outside@email.com"
          className="mt-1 w-full rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        />
      </label>
      <button
        type="button"
        disabled={pending || !canSend}
        onClick={() => {
          setError(null);
          setSentNote(null);
          startTransition(async () => {
            const result = await inviteWebinarGuestsAction(webinarId, payloadEmails());
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
            setSelected(new Set());
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

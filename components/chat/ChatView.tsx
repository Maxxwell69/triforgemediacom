"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { ROLE_LABELS } from "@/lib/rbac";
import { canModerate, canBeModerationTarget, isMuted, MUTE_DURATION_PRESETS_MINUTES } from "@/lib/moderation";

type ChatRole = keyof typeof ROLE_LABELS;

type ChatUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: ChatRole;
  mutedUntil: string | Date | null;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: ChatUser;
};

const POLL_INTERVAL_MS = 3000;

const MUTE_DURATION_LABELS: Record<number, string> = {
  10: "10 min",
  60: "1 hour",
  1440: "24 hours",
  10080: "7 days",
};

function toMutedUntilDate(value: string | Date | null): Date | null {
  return value ? new Date(value) : null;
}

export default function ChatView({
  channel,
  currentUserId,
  currentUserRole,
  initialMessages,
  initialMutedUntil,
}: {
  channel: { id: string; name: string; description: string | null };
  currentUserId: string;
  currentUserRole: ChatRole;
  initialMessages: ChatMessage[];
  initialMutedUntil: string | Date | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutedUntil, setMutedUntil] = useState<string | Date | null>(initialMutedUntil);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [moderationBusy, setModerationBusy] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  const viewerIsMuted = isMuted({ mutedUntil: toMutedUntilDate(mutedUntil) });
  const isModerator = canModerate(currentUserRole);

  // Reset local state when navigating between channels.
  useEffect(() => {
    setMessages(initialMessages);
    seenIds.current = new Set(initialMessages.map((m) => m.id));
    setMutedUntil(initialMutedUntil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const latest = messages[messages.length - 1];
      const after = latest ? new Date(latest.createdAt).toISOString() : undefined;
      const url = `/api/channels/${channel.id}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setMutedUntil(data.mutedUntil ?? null);
        const fresh: ChatMessage[] = (data.messages || []).filter(
          (m: ChatMessage) => !seenIds.current.has(m.id)
        );
        if (fresh.length > 0) {
          fresh.forEach((m) => seenIds.current.add(m.id));
          setMessages((prev) => [...prev, ...fresh]);
        }
      } catch {
        // Polling is best-effort; ignore transient network errors.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id, messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message");
        if (data.mutedUntil) setMutedUntil(data.mutedUntil);
        return;
      }
      if (!seenIds.current.has(data.message.id)) {
        seenIds.current.add(data.message.id);
        setMessages((prev) => [...prev, data.message]);
      }
      setDraft("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(message: ChatMessage) {
    if (!confirm("Delete this message? This can't be undone.")) return;
    setModerationBusy(message.id);
    try {
      const res = await fetch(`/api/channels/${channel.id}/messages/${message.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }
    } finally {
      setModerationBusy(null);
    }
  }

  async function handleMute(userId: string, durationMinutes: number) {
    setModerationBusy(userId);
    setOpenMenuFor(null);
    try {
      const res = await fetch(`/api/users/${userId}/mute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.user.id === userId ? { ...m, user: { ...m.user, mutedUntil: data.mutedUntil } } : m
          )
        );
      }
    } finally {
      setModerationBusy(null);
    }
  }

  async function handleUnmute(userId: string) {
    setModerationBusy(userId);
    setOpenMenuFor(null);
    try {
      const res = await fetch(`/api/users/${userId}/unmute`, { method: "POST" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.user.id === userId ? { ...m, user: { ...m.user, mutedUntil: null } } : m))
        );
      }
    } finally {
      setModerationBusy(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-off-white/10 px-6 py-4">
        <h1 className="font-display text-2xl tracking-wide"># {channel.name}</h1>
        {channel.description && (
          <p className="font-body text-sm text-off-white/50">{channel.description}</p>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center font-body text-sm text-off-white/40">
            No messages yet. Say hi 👋
          </p>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const isAuthor = message.user.id === currentUserId;
            const canDelete = isAuthor || isModerator;
            const canModerateAuthor =
              isModerator && !isAuthor && canBeModerationTarget(message.user.role);
            const authorMuted = isMuted({ mutedUntil: toMutedUntilDate(message.user.mutedUntil) });

            return (
              <div key={message.id} className="group flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-off-white/10 font-display text-sm">
                  {(message.user.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-body text-sm font-semibold ${
                        isAuthor ? "text-cyan" : "text-off-white"
                      }`}
                    >
                      {message.user.name || "Unknown"}
                    </span>
                    {message.user.role !== "MEMBER" && (
                      <span className="rounded bg-orange/15 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                        {ROLE_LABELS[message.user.role]}
                      </span>
                    )}
                    {authorMuted && (
                      <span className="rounded bg-off-white/10 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/50">
                        Muted
                      </span>
                    )}
                    <span className="font-body text-xs text-off-white/30">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="ml-auto flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                      {canModerateAuthor && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuFor(openMenuFor === message.id ? null : message.id)
                            }
                            disabled={moderationBusy === message.user.id}
                            className="rounded border border-off-white/15 px-1.5 py-0.5 font-body text-[10px] text-off-white/50 transition hover:border-cyan/40 hover:text-cyan disabled:opacity-40"
                          >
                            Moderate
                          </button>
                          {openMenuFor === message.id && (
                            <div className="glass absolute right-0 z-10 mt-1 flex w-36 flex-col gap-1 rounded-lg p-2">
                              {authorMuted ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnmute(message.user.id)}
                                  className="rounded px-2 py-1 text-left font-body text-xs text-cyan transition hover:bg-cyan/10"
                                >
                                  Unmute
                                </button>
                              ) : (
                                MUTE_DURATION_PRESETS_MINUTES.map((minutes) => (
                                  <button
                                    key={minutes}
                                    type="button"
                                    onClick={() => handleMute(message.user.id, minutes)}
                                    className="rounded px-2 py-1 text-left font-body text-xs text-off-white/70 transition hover:bg-orange/10 hover:text-orange"
                                  >
                                    Mute {MUTE_DURATION_LABELS[minutes]}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(message)}
                          disabled={moderationBusy === message.id}
                          title="Delete message"
                          className="rounded border border-off-white/15 px-1.5 py-0.5 font-body text-[10px] text-off-white/50 transition hover:border-orange/40 hover:text-orange disabled:opacity-40"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words font-body text-sm text-off-white/85">
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-off-white/10 px-6 py-4">
        {error && <p className="mb-2 font-body text-xs text-orange">{error}</p>}
        {viewerIsMuted && (
          <p className="mb-2 font-body text-xs text-orange">
            You&apos;re muted until{" "}
            {toMutedUntilDate(mutedUntil)!.toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            .
          </p>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={viewerIsMuted ? "You're muted" : `Message #${channel.name}`}
            maxLength={2000}
            disabled={viewerIsMuted}
            className="flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim() || viewerIsMuted}
            className="rounded-lg bg-orange px-6 py-2.5 font-body font-semibold text-off-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

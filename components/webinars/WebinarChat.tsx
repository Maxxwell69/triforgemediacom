"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
};

const MUTE_PRESETS = [
  { minutes: 10, label: "10 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 0, label: "Session" },
] as const;

export default function WebinarChat({
  webinarId,
  canSend,
  canModerate = false,
  currentUserId,
  embedded = false,
  active = true,
  onUnreadChange,
}: {
  webinarId: string;
  canSend: boolean;
  canModerate?: boolean;
  currentUserId?: string;
  /** Hide outer border/title when nested in the Chat/People side panel. */
  embedded?: boolean;
  /** When false (e.g. People tab), new messages from others bump the unread badge. */
  active?: boolean;
  onUnreadChange?: (count: number) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMutedUntil, setChatMutedUntil] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<string | null>(null);
  const removedCursorRef = useRef<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(active);
  const unreadRef = useRef(0);
  const onUnreadChangeRef = useRef(onUnreadChange);

  activeRef.current = active;
  onUnreadChangeRef.current = onUnreadChange;

  function setUnread(count: number) {
    unreadRef.current = count;
    onUnreadChangeRef.current?.(count);
  }

  function noteIncoming(messages: ChatMessage[], countTowardUnread: boolean) {
    let fromOthers = 0;
    for (const m of messages) {
      if (knownIdsRef.current.has(m.id)) continue;
      knownIdsRef.current.add(m.id);
      if (countTowardUnread && m.user.id !== currentUserId) fromOthers += 1;
    }
    if (fromOthers > 0) setUnread(unreadRef.current + fromOthers);
  }

  useEffect(() => {
    if (active) setUnread(0);
  }, [active]);

  useEffect(() => {
    let cancelled = false;

    async function load(initial: boolean) {
      const cursor = afterRef.current || removedCursorRef.current;
      const qs = !initial && cursor ? `?after=${encodeURIComponent(cursor)}` : "";
      try {
        const res = await fetch(`/api/webinars/${webinarId}/chat${qs}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          messages: ChatMessage[];
          removedIds?: string[];
          chatMutedUntil?: string | null;
        };
        if (cancelled) return;
        if (typeof data.chatMutedUntil !== "undefined") {
          setChatMutedUntil(data.chatMutedUntil);
        }
        if (initial) {
          knownIdsRef.current = new Set(data.messages.map((m) => m.id));
          setMessages(data.messages);
        } else {
          if (data.removedIds && data.removedIds.length > 0) {
            const drop = new Set(data.removedIds);
            data.removedIds.forEach((id) => knownIdsRef.current.delete(id));
            setMessages((prev) => prev.filter((m) => !drop.has(m.id)));
          }
          if (data.messages.length > 0) {
            noteIncoming(data.messages, !activeRef.current);
            setMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              const next = [...prev];
              for (const m of data.messages) {
                if (!seen.has(m.id)) next.push(m);
              }
              return next.length === prev.length ? prev : next;
            });
          }
        }
        if (data.messages.length > 0) {
          afterRef.current = data.messages[data.messages.length - 1].createdAt;
          removedCursorRef.current = afterRef.current;
        } else if (!removedCursorRef.current) {
          removedCursorRef.current = new Date().toISOString();
        }
      } catch {
        // ignore transient poll errors
      }
    }

    void load(true);
    const id = setInterval(() => void load(false), 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [webinarId, currentUserId]);

  useEffect(() => {
    if (!active) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, active]);

  useEffect(() => {
    if (!openMenuFor) return;
    function onPointer() {
      setOpenMenuFor(null);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [openMenuFor]);

  const muted =
    !!chatMutedUntil && new Date(chatMutedUntil).getTime() > Date.now();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending || muted) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/webinars/${webinarId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send");
        return;
      }
      setBody("");
      knownIdsRef.current.add(data.message.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      afterRef.current = data.message.createdAt;
      removedCursorRef.current = data.message.createdAt;
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function moderate(bodyPayload: Record<string, unknown>) {
    const res = await fetch(`/api/webinars/${webinarId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function handleDelete(message: ChatMessage) {
    if (!confirm("Delete this message?")) return;
    setBusy(message.id);
    try {
      const { ok, data } = await moderate({
        action: "delete_message",
        messageId: message.id,
      });
      if (ok) {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        knownIdsRef.current.delete(message.id);
      } else {
        setError(data.error || "Could not delete");
      }
    } finally {
      setBusy(null);
      setOpenMenuFor(null);
    }
  }

  async function handleMute(userId: string, durationMinutes: number) {
    setBusy(userId);
    try {
      const { ok, data } = await moderate({
        action: "mute_chat",
        userId,
        durationMinutes,
      });
      if (!ok) setError(data.error || "Could not mute");
    } finally {
      setBusy(null);
      setOpenMenuFor(null);
    }
  }

  async function handleUnmute(userId: string) {
    setBusy(userId);
    try {
      await moderate({ action: "unmute_chat", userId });
    } finally {
      setBusy(null);
      setOpenMenuFor(null);
    }
  }

  async function handleKick(userId: string) {
    if (!confirm("Kick this person from the webinar?")) return;
    setBusy(userId);
    try {
      const { ok, data } = await moderate({ action: "kick", userId });
      if (!ok) setError(data.error || "Could not kick");
    } finally {
      setBusy(null);
      setOpenMenuFor(null);
    }
  }

  async function handleClearChat() {
    if (!confirm("Clear all chat messages for everyone?")) return;
    setBusy("clear");
    try {
      const { ok, data } = await moderate({ action: "clear_chat" });
      if (ok) {
        setMessages([]);
        knownIdsRef.current.clear();
        setUnread(0);
      } else setError(data.error || "Could not clear chat");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${
        embedded ? "" : "border-l border-off-white/10 bg-charcoal/80"
      }`}
    >
      {!embedded && (
        <div className="border-b border-off-white/10 px-4 py-3">
          <h2 className="font-display text-lg tracking-wide text-off-white/80">Chat</h2>
        </div>
      )}
      {canModerate && (
        <div className="flex shrink-0 items-center justify-end border-b border-off-white/10 px-3 py-1.5">
          <button
            type="button"
            disabled={busy === "clear" || messages.length === 0}
            onClick={() => void handleClearChat()}
            className="font-body text-[11px] text-off-white/40 hover:text-orange disabled:opacity-40"
          >
            Clear chat
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="font-body text-xs text-off-white/40">No messages yet. Say hello.</p>
          )}
          {messages.map((m) => {
            const isSelf = m.user.id === currentUserId;
            const showMod = canModerate && !isSelf;
            return (
              <div
                key={m.id}
                className="group relative"
                onContextMenu={(e) => {
                  if (!showMod) return;
                  e.preventDefault();
                  setOpenMenuFor(m.id);
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-body text-xs text-cyan/80">{m.user.name}</p>
                  {showMod && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuFor(openMenuFor === m.id ? null : m.id);
                      }}
                      className="font-body text-[10px] text-off-white/30 opacity-0 transition group-hover:opacity-100 hover:text-off-white/70"
                    >
                      Mod
                    </button>
                  )}
                </div>
                <p className="font-body text-sm text-off-white/90">{m.body}</p>
                {openMenuFor === m.id && showMod && (
                  <div
                    className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-off-white/15 bg-charcoal p-1.5 shadow-xl"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => void handleDelete(m)}
                      className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-orange hover:bg-orange/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                    {MUTE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        disabled={busy === m.user.id}
                        onClick={() => void handleMute(m.user.id, p.minutes)}
                        className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-off-white/70 hover:bg-off-white/10 disabled:opacity-50"
                      >
                        Mute {p.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={busy === m.user.id}
                      onClick={() => void handleUnmute(m.user.id)}
                      className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-off-white/70 hover:bg-off-white/10 disabled:opacity-50"
                    >
                      Unmute
                    </button>
                    <button
                      type="button"
                      disabled={busy === m.user.id}
                      onClick={() => void handleKick(m.user.id)}
                      className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-orange hover:bg-orange/10 disabled:opacity-50"
                    >
                      Kick
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
      {canSend && (
        <form onSubmit={send} className="shrink-0 border-t border-off-white/10 p-3">
          {error && <p className="mb-2 font-body text-xs text-orange">{error}</p>}
          {muted ? (
            <p className="font-body text-xs text-orange">
              You&apos;re muted in this chat
              {chatMutedUntil
                ? ` until ${new Date(chatMutedUntil).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}`
                : ""}
              .
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                placeholder="Message the room…"
                className="min-w-0 flex-1 rounded-lg border border-off-white/15 bg-charcoal px-3 py-2 font-body text-sm text-off-white outline-none focus:border-orange"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="rounded-lg bg-orange px-3 py-2 font-body text-sm font-semibold text-charcoal disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

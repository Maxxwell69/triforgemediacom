"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { ROLE_LABELS } from "@/lib/rbac";

type ChatUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: keyof typeof ROLE_LABELS;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: ChatUser;
};

const POLL_INTERVAL_MS = 3000;

export default function ChatView({
  channel,
  currentUserId,
  initialMessages,
}: {
  channel: { id: string; name: string; description: string | null };
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  // Reset local state when navigating between channels.
  useEffect(() => {
    setMessages(initialMessages);
    seenIds.current = new Set(initialMessages.map((m) => m.id));
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
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-off-white/10 font-display text-sm">
                {(message.user.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-body text-sm font-semibold ${
                      message.user.id === currentUserId ? "text-cyan" : "text-off-white"
                    }`}
                  >
                    {message.user.name || "Unknown"}
                  </span>
                  {message.user.role !== "MEMBER" && (
                    <span className="rounded bg-orange/15 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                      {ROLE_LABELS[message.user.role]}
                    </span>
                  )}
                  <span className="font-body text-xs text-off-white/30">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words font-body text-sm text-off-white/85">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-off-white/10 px-6 py-4">
        {error && <p className="mb-2 font-body text-xs text-orange">{error}</p>}
        <div className="flex gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message #${channel.name}`}
            maxLength={2000}
            className="flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-orange px-6 py-2.5 font-body font-semibold text-off-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

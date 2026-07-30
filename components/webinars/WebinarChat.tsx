"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
};

export default function WebinarChat({
  webinarId,
  canSend,
  embedded = false,
}: {
  webinarId: string;
  canSend: boolean;
  /** Hide outer border/title when nested in the Chat/People side panel. */
  embedded?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(initial: boolean) {
      const qs = !initial && afterRef.current ? `?after=${encodeURIComponent(afterRef.current)}` : "";
      try {
        const res = await fetch(`/api/webinars/${webinarId}/chat${qs}`);
        if (!res.ok) return;
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (cancelled) return;
        if (initial) {
          setMessages(data.messages);
        } else if (data.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const next = [...prev];
            for (const m of data.messages) {
              if (!seen.has(m.id)) next.push(m);
            }
            return next;
          });
        }
        if (data.messages.length > 0) {
          afterRef.current = data.messages[data.messages.length - 1].createdAt;
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
  }, [webinarId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
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
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
      afterRef.current = data.message.createdAt;
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
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
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="font-body text-xs text-off-white/40">No messages yet. Say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <p className="font-body text-xs text-cyan/80">{m.user.name}</p>
            <p className="font-body text-sm text-off-white/90">{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {canSend && (
        <form onSubmit={send} className="border-t border-off-white/10 p-3">
          {error && <p className="mb-2 font-body text-xs text-orange">{error}</p>}
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
        </form>
      )}
    </div>
  );
}

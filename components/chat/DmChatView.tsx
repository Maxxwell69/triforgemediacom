"use client";

import { useEffect, useRef, useState, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/rbac";
import { isMuted } from "@/lib/moderation";
import { buildMentionToken, getActiveMentionQuery } from "@/lib/chatMentions";
import type { ReactionSummary } from "@/lib/dmAccess";
import MessageContent from "@/components/chat/MessageContent";
import MessageReactions from "@/components/chat/MessageReactions";
import EmojiPickerButton from "@/components/chat/EmojiPickerButton";
import { useScrollToLatest } from "@/components/chat/useScrollToLatest";

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
  reactions: ReactionSummary[];
};

type MentionCandidate = { id: string; name: string; image: string | null };

const POLL_INTERVAL_MS = 3000;

function toMutedUntilDate(value: string | Date | null): Date | null {
  return value ? new Date(value) : null;
}

export default function DmChatView({
  conversationId,
  title,
  currentUserId,
  initialMessages,
  initialMutedUntil,
}: {
  conversationId: string;
  title: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  initialMutedUntil: string | Date | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutedUntil, setMutedUntil] = useState<string | Date | null>(initialMutedUntil);
  const [mentionQuery, setMentionQuery] = useState<{ start: number; query: string } | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionCandidate[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const mentionFetchRef = useRef(0);
  const latestMessageId = messages[messages.length - 1]?.id ?? null;

  useScrollToLatest(scrollRef, bottomRef, {
    roomKey: conversationId,
    messageCount: messages.length,
    latestMessageId,
  });

  const viewerIsMuted = isMuted({ mutedUntil: toMutedUntilDate(mutedUntil) });

  useEffect(() => {
    setMessages(initialMessages);
    seenIds.current = new Set(initialMessages.map((m) => m.id));
    setMutedUntil(initialMutedUntil);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const latest = messages[messages.length - 1];
      const after = latest ? new Date(latest.createdAt).toISOString() : undefined;
      const url = `/api/dms/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`;
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
        // ignore
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages]);

  useEffect(() => {
    if (!mentionQuery) {
      setMentionResults([]);
      return;
    }
    const id = ++mentionFetchRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(mentionQuery.query)}`);
        if (!res.ok || id !== mentionFetchRef.current) return;
        const data = await res.json();
        setMentionResults(data.members || []);
        setMentionIndex(0);
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [mentionQuery]);

  function updateDraft(next: string, caret?: number) {
    setDraft(next);
    setMentionQuery(getActiveMentionQuery(next, caret ?? next.length));
  }

  function insertAtCaret(text: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + text + draft.slice(end);
    const caret = start + text.length;
    updateDraft(next, caret);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function applyMention(member: MentionCandidate) {
    if (!mentionQuery) return;
    const token = `${buildMentionToken(member)} `;
    const before = draft.slice(0, mentionQuery.start);
    const caretGuess = inputRef.current?.selectionStart ?? draft.length;
    const after = draft.slice(caretGuess);
    const next = before + token + after;
    const caret = before.length + token.length;
    setDraft(next);
    setMentionQuery(null);
    setMentionResults([]);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  }

  function onDraftChange(e: ChangeEvent<HTMLInputElement>) {
    updateDraft(e.target.value, e.target.selectionStart ?? e.target.value.length);
  }

  function onDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!mentionQuery || mentionResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => (i + 1) % mentionResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      applyMention(mentionResults[mentionIndex]!);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mentionQuery && mentionResults.length > 0) {
      applyMention(mentionResults[mentionIndex]!);
      return;
    }
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/dms/${conversationId}/messages`, {
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
        setMessages((prev) => [...prev, { ...data.message, reactions: data.message.reactions || [] }]);
      }
      setDraft("");
      setMentionQuery(null);
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const res = await fetch(`/api/dms/${conversationId}/messages/${messageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions || [] } : m))
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-off-white/10 px-6 py-4">
        <Link href="/dms" className="font-body text-xs text-off-white/40 transition hover:text-off-white">
          &larr; Direct messages
        </Link>
        <h1 className="mt-1 font-display text-2xl tracking-wide">{title}</h1>
        <p className="font-body text-xs text-off-white/40">Private conversation</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center font-body text-sm text-off-white/40">
            No messages yet. Start the conversation.
          </p>
        )}
        <div className="flex flex-col gap-4">
          {messages.map((message) => {
            const isAuthor = message.user.id === currentUserId;
            return (
              <div key={message.id} className="group flex gap-3">
                <Link
                  href={`/members/${message.user.id}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-off-white/10 font-display text-sm transition hover:ring-2 hover:ring-cyan/60"
                >
                  {(message.user.name || "?").charAt(0).toUpperCase()}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/members/${message.user.id}`}
                      className={`font-body text-sm font-semibold hover:underline ${
                        isAuthor ? "text-cyan" : "text-off-white hover:text-cyan"
                      }`}
                    >
                      {message.user.name || "Unknown"}
                    </Link>
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
                  <MessageContent content={message.content} />
                  <MessageReactions
                    reactions={message.reactions || []}
                    onToggle={(emoji) => toggleReaction(message.id, emoji)}
                  />
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative border-t border-off-white/10 px-6 py-4">
        {error && <p className="mb-2 font-body text-xs text-orange">{error}</p>}
        {viewerIsMuted && (
          <p className="mb-2 font-body text-xs text-orange">You&apos;re muted and can&apos;t send.</p>
        )}
        {mentionQuery && mentionResults.length > 0 && (
          <div className="glass absolute bottom-full left-6 right-6 z-20 mb-2 max-h-48 overflow-y-auto rounded-xl p-1">
            {mentionResults.map((member, i) => (
              <button
                key={member.id}
                type="button"
                onClick={() => applyMention(member)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-body text-sm transition ${
                  i === mentionIndex ? "bg-cyan/15 text-cyan" : "text-off-white/80 hover:bg-off-white/5"
                }`}
              >
                @{member.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={onDraftChange}
            onKeyDown={onDraftKeyDown}
            placeholder={viewerIsMuted ? "You're muted" : `Message ${title}`}
            maxLength={2000}
            disabled={viewerIsMuted}
            className="flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <EmojiPickerButton disabled={viewerIsMuted} onPick={insertAtCaret} />
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

"use client";

import { useEffect, useRef, useState, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/rbac";
import { canModerate, canBeModerationTarget, isMuted, MUTE_DURATION_PRESETS_MINUTES } from "@/lib/moderation";
import { buildMentionToken, getActiveMentionQuery } from "@/lib/chatMentions";
import type { ReactionSummary } from "@/lib/dmAccess";
import MessageContent from "@/components/chat/MessageContent";
import MessageReactions from "@/components/chat/MessageReactions";
import EmojiPickerButton from "@/components/chat/EmojiPickerButton";
import { truncateReplyPreview } from "@/lib/chatReplies";

type ChatRole = keyof typeof ROLE_LABELS;

type ChatUser = {
  id: string;
  name: string | null;
  image: string | null;
  role: ChatRole;
  mutedUntil: string | Date | null;
};

type ReplyPreview = {
  id: string;
  content: string;
  user: ChatUser;
};

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: ChatUser;
  reactions: ReactionSummary[];
  replyToId?: string | null;
  replyTo?: ReplyPreview | null;
};

type MentionCandidate = { id: string; name: string; image: string | null };

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
  const [mentionQuery, setMentionQuery] = useState<{ start: number; query: string } | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionCandidate[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(() => new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const mentionFetchRef = useRef(0);

  const viewerIsMuted = isMuted({ mutedUntil: toMutedUntilDate(mutedUntil) });
  const isModerator = canModerate(currentUserRole);

  useEffect(() => {
    setMessages(initialMessages);
    seenIds.current = new Set(initialMessages.map((m) => m.id));
    setMutedUntil(initialMutedUntil);
    setReplyingTo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  function startReply(message: ChatMessage) {
    setReplyingTo(message);
    setOpenMenuFor(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function scrollToMessage(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-1", "ring-cyan/50");
    window.setTimeout(() => el?.classList.remove("ring-1", "ring-cyan/50"), 1200);
  }

  // Keep Discord-style unread badge clear while this channel is open.
  useEffect(() => {
    void fetch(`/api/channels/${channel.id}/read`, { method: "POST" });
  }, [channel.id]);

  // Refresh who's online among authors currently in the thread.
  const authorIdsKey = Array.from(new Set(messages.map((m) => m.user.id))).sort().join(",");
  useEffect(() => {
    if (!authorIdsKey) return;
    const ids = authorIdsKey.split(",");

    let cancelled = false;
    async function refreshPresence() {
      try {
        const res = await fetch(`/api/presence?ids=${encodeURIComponent(ids.join(","))}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setOnlineIds(new Set(data.onlineIds || []));
      } catch {
        // best-effort
      }
    }

    void refreshPresence();
    const id = window.setInterval(() => void refreshPresence(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [channel.id, authorIdsKey]);

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

  useEffect(() => {
    if (!mentionQuery) {
      setMentionResults([]);
      return;
    }
    const id = ++mentionFetchRef.current;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/members/search?q=${encodeURIComponent(mentionQuery.query)}`
        );
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
    const pos = caret ?? next.length;
    setMentionQuery(getActiveMentionQuery(next, pos));
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
    if (e.key === "Escape" && replyingTo && !mentionQuery) {
      e.preventDefault();
      setReplyingTo(null);
      return;
    }
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
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          replyToId: replyingTo?.id ?? null,
        }),
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
      setReplyingTo(null);
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

  async function toggleReaction(messageId: string, emoji: string) {
    const res = await fetch(`/api/channels/${channel.id}/messages/${messageId}/reactions`, {
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

            const reply = message.replyTo ?? null;
            const authorOnline = onlineIds.has(message.user.id);

            return (
              <div
                key={message.id}
                id={`msg-${message.id}`}
                className="group flex scroll-mt-4 gap-3 rounded-lg transition"
              >
                <Link
                  href={`/members/${message.user.id}`}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-off-white/10 font-display text-sm transition hover:ring-2 hover:ring-cyan/60"
                >
                  {(message.user.name || "?").charAt(0).toUpperCase()}
                  {authorOnline && (
                    <span
                      className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-charcoal bg-emerald-400"
                      title="Online"
                      aria-label="Online"
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  {reply && (
                    <button
                      type="button"
                      onClick={() => scrollToMessage(reply.id)}
                      className="mb-1 flex max-w-full items-start gap-2 rounded-md border-l-2 border-cyan/50 bg-off-white/[0.03] px-2 py-1 text-left transition hover:bg-off-white/[0.06]"
                    >
                      <span className="truncate font-body text-[11px] text-off-white/45">
                        <span className="font-semibold text-cyan/80">
                          {reply.user.name || "Unknown"}
                        </span>
                        <span className="mx-1 text-off-white/25">·</span>
                        {truncateReplyPreview(reply.content)}
                      </span>
                    </button>
                  )}
                  {!reply && message.replyToId && (
                    <p className="mb-1 border-l-2 border-off-white/15 px-2 font-body text-[11px] italic text-off-white/35">
                      Original message deleted
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <Link
                      href={`/members/${message.user.id}`}
                      className={`inline-flex items-center gap-1.5 font-body text-sm font-semibold hover:underline ${
                        isAuthor ? "text-cyan" : "text-off-white hover:text-cyan"
                      }`}
                    >
                      {authorOnline && (
                        <span
                          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                          title="Online"
                          aria-hidden
                        />
                      )}
                      {message.user.name || "Unknown"}
                    </Link>
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
                      {!viewerIsMuted && (
                        <button
                          type="button"
                          onClick={() => startReply(message)}
                          title="Reply"
                          className="rounded border border-off-white/15 px-1.5 py-0.5 font-body text-[10px] text-off-white/50 transition hover:border-cyan/40 hover:text-cyan"
                        >
                          Reply
                        </button>
                      )}
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
                  <MessageContent content={message.content} />
                  <MessageReactions
                    reactions={message.reactions || []}
                    onToggle={(emoji) => toggleReaction(message.id, emoji)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative border-t border-off-white/10 px-6 py-4">
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
        {replyingTo && !viewerIsMuted && (
          <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-cyan/25 bg-cyan/5 px-3 py-2">
            <div className="min-w-0">
              <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-cyan">
                Replying to {replyingTo.user.name || "Unknown"}
              </p>
              <p className="truncate font-body text-xs text-off-white/50">
                {truncateReplyPreview(replyingTo.content)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="shrink-0 rounded px-1.5 py-0.5 font-body text-xs text-off-white/50 transition hover:bg-off-white/10 hover:text-off-white"
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-off-white/10 text-xs">
                  {member.name.charAt(0).toUpperCase()}
                </span>
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
            onClick={(e) =>
              updateDraft(draft, (e.target as HTMLInputElement).selectionStart ?? draft.length)
            }
            placeholder={
              viewerIsMuted
                ? "You're muted"
                : replyingTo
                  ? `Reply to ${replyingTo.user.name || "message"}…`
                  : `Message #${channel.name} — type @ to mention`
            }
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

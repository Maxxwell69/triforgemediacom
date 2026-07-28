"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseMentionSegments } from "@/lib/chatMentions";

type ConversationRow = {
  id: string;
  title: string;
  updatedAt: string;
  lastMessage: { content: string; createdAt: string } | null;
  participants: { id: string; name: string; role: string }[];
};

type MentionCandidate = { id: string; name: string };

function previewContent(content: string): string {
  return parseMentionSegments(content)
    .map((s) => (s.type === "mention" ? `@${s.name}` : s.value))
    .join("");
}

export default function DmInbox({
  initialConversations,
  canInitiate,
}: {
  initialConversations: ConversationRow[];
  canInitiate: boolean;
}) {
  const router = useRouter();
  const [conversations] = useState(initialConversations);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MentionCandidate[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canInitiate || query.trim().length < 1) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.members || []);
    }, 150);
    return () => clearTimeout(handle);
  }, [query, canInitiate]);

  async function startDm(userId: string) {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't start conversation");
        return;
      }
      router.push(`/dms/${data.conversationId}`);
    } catch {
      setError("Couldn't start conversation");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="font-display text-4xl tracking-wide">
        DIRECT <span className="text-gradient">MESSAGES</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Private 1:1 chats. All admins can see every thread.
      </p>

      {canInitiate && (
        <div className="glass relative mt-6 rounded-2xl p-4">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Start a conversation
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members by name…"
            className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
          />
          {results.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={starting}
                  onClick={() => startDm(m.id)}
                  className="rounded-lg px-3 py-2 text-left font-body text-sm text-off-white/80 transition hover:bg-cyan/10 hover:text-cyan disabled:opacity-40"
                >
                  Message {m.name}
                </button>
              ))}
            </div>
          )}
          {error && <p className="mt-2 font-body text-xs text-orange">{error}</p>}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {conversations.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center font-body text-sm text-off-white/40">
            No conversations yet.
          </p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/dms/${c.id}`}
              className="glass flex flex-col gap-1 rounded-xl px-4 py-3 transition hover:border-cyan/40"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm font-semibold text-off-white">{c.title}</p>
                <span className="font-body text-[10px] text-off-white/30">
                  {new Date(c.updatedAt).toLocaleDateString([], { dateStyle: "medium" })}
                </span>
              </div>
              {c.lastMessage && (
                <p className="truncate font-body text-xs text-off-white/45">
                  {previewContent(c.lastMessage.content)}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

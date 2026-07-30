"use client";

import { useEffect, useRef, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { Track } from "livekit-client";

function roleLabel(participant: Participant): string {
  try {
    const meta = JSON.parse(participant.metadata || "{}") as { role?: string };
    if (meta.role === "host") return "Host";
    if (meta.role === "speaker") return "Speaker";
  } catch {
    // ignore
  }
  if (participant.permissions?.canPublish) return "On stage";
  return "Watching";
}

function roleRank(participant: Participant): number {
  const label = roleLabel(participant);
  if (label === "Host") return 0;
  if (label === "Speaker" || label === "On stage") return 1;
  return 2;
}

type MenuState = { userId: string; x: number; y: number } | null;

const MUTE_PRESETS = [
  { minutes: 10, label: "10 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 0, label: "Rest of session" },
] as const;

async function moderate(
  webinarId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/webinars/${webinarId}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || "Action failed" };
  return { ok: true };
}

export default function WebinarParticipants({
  webinarId,
  canModerate,
  designatedHostUserId,
}: {
  webinarId: string;
  canModerate: boolean;
  designatedHostUserId?: string | null;
}) {
  const participants = useParticipants();
  const [menu, setMenu] = useState<MenuState>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sorted = [...participants].sort((a, b) => {
    const rank = roleRank(a) - roleRank(b);
    if (rank !== 0) return rank;
    const an = a.name || a.identity;
    const bn = b.name || b.identity;
    return an.localeCompare(bn);
  });

  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    function onPointer(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [menu]);

  function openMenu(e: React.MouseEvent, userId: string, isLocal: boolean) {
    if (!canModerate || isLocal) return;
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setMenu({ userId, x: e.clientX, y: e.clientY });
  }

  async function run(action: string, extra: Record<string, unknown> = {}) {
    if (!menu) return;
    setBusy(true);
    setError(null);
    const result = await moderate(webinarId, {
      action,
      userId: menu.userId,
      ...extra,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Failed");
      return;
    }
    setMenu(null);
  }

  const target = menu ? sorted.find((p) => p.identity === menu.userId) : null;
  const targetLabel = target ? roleLabel(target) : null;
  const isDesignatedHost = menu?.userId === designatedHostUserId;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {canModerate && (
          <p className="mb-2 font-body text-[11px] text-off-white/35">
            Tap ··· (or long-press) to invite, demote, mute, or kick.
          </p>
        )}
        {sorted.length === 0 ? (
          <p className="font-body text-xs text-off-white/40">No one here yet.</p>
        ) : (
          sorted.map((p) => {
            const label = roleLabel(p);
            const cam = p.isCameraEnabled || p.getTrackPublication(Track.Source.Camera)?.isSubscribed;
            const mic = p.isMicrophoneEnabled;
            const sharing = p.isScreenShareEnabled;

            return (
              <div
                key={p.identity}
                onContextMenu={(e) => openMenu(e, p.identity, p.isLocal)}
                className={`flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-off-white/5 ${
                  canModerate && !p.isLocal ? "cursor-context-menu" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-sm text-off-white/90">
                    {p.name || p.identity}
                    {p.isLocal ? (
                      <span className="ml-1 text-xs text-off-white/40">(you)</span>
                    ) : null}
                  </p>
                  <p
                    className={`font-body text-xs ${
                      label === "Host"
                        ? "text-orange"
                        : label === "Speaker" || label === "On stage"
                          ? "text-cyan"
                          : "text-off-white/40"
                    }`}
                  >
                    {label}
                    {sharing ? " · Sharing screen" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex gap-1 font-body text-[11px] text-off-white/40">
                    <span title={mic ? "Mic on" : "Mic off"}>{mic ? "Mic" : "Mic off"}</span>
                    <span aria-hidden>·</span>
                    <span title={cam ? "Camera on" : "Camera off"}>{cam ? "Cam" : "Cam off"}</span>
                  </div>
                  {canModerate && !p.isLocal && (
                    <button
                      type="button"
                      aria-label={`Moderate ${p.name || "participant"}`}
                      onClick={(e) => openMenu(e, p.identity, false)}
                      className="rounded px-1.5 py-0.5 font-body text-[11px] text-off-white/40 hover:bg-off-white/10 hover:text-off-white/70"
                    >
                      ···
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="border-t border-off-white/10 px-3 py-2 font-body text-xs text-off-white/40">
        {sorted.length} in room
      </p>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 max-h-[70vh] w-[min(13rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-off-white/15 bg-charcoal p-1.5 shadow-xl"
          style={{
            left: Math.min(menu.x, Math.max(8, window.innerWidth - 220)),
            top: Math.min(menu.y, Math.max(8, window.innerHeight - 280)),
          }}
        >
          <p className="truncate px-2 py-1 font-body text-[11px] text-off-white/40">
            {target?.name || menu.userId}
          </p>
          {error && (
            <p className="px-2 py-1 font-body text-[11px] text-orange">{error}</p>
          )}
          {(targetLabel === "Watching" || !target?.permissions?.canPublish) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("invite_stage")}
              className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-cyan hover:bg-cyan/10 disabled:opacity-50"
            >
              Invite to stage
            </button>
          )}
          {(targetLabel === "Speaker" || targetLabel === "On stage") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("remove_stage")}
              className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-off-white/80 hover:bg-off-white/10 disabled:opacity-50"
            >
              Remove from stage
            </button>
          )}
          {targetLabel === "Host" && !isDesignatedHost && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run("demote_host")}
              className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-orange hover:bg-orange/10 disabled:opacity-50"
            >
              Remove host
            </button>
          )}
          <div className="my-1 border-t border-off-white/10" />
          <p className="px-2 py-0.5 font-body text-[10px] uppercase tracking-wide text-off-white/30">
            Mute chat
          </p>
          {MUTE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={busy}
              onClick={() => void run("mute_chat", { durationMinutes: p.minutes })}
              className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-off-white/70 hover:bg-off-white/10 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("unmute_chat")}
            className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-off-white/70 hover:bg-off-white/10 disabled:opacity-50"
          >
            Unmute chat
          </button>
          <div className="my-1 border-t border-off-white/10" />
          <button
            type="button"
            disabled={busy || isDesignatedHost}
            onClick={() => {
              if (!confirm("Kick this person from the webinar?")) return;
              void run("kick");
            }}
            className="w-full rounded px-2 py-1.5 text-left font-body text-xs text-orange hover:bg-orange/10 disabled:opacity-50"
          >
            Kick from room
          </button>
        </div>
      )}
    </div>
  );
}

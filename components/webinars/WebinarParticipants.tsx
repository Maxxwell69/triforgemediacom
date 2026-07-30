"use client";

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

export default function WebinarParticipants() {
  const participants = useParticipants();

  const sorted = [...participants].sort((a, b) => {
    const rank = roleRank(a) - roleRank(b);
    if (rank !== 0) return rank;
    const an = a.name || a.identity;
    const bn = b.name || b.identity;
    return an.localeCompare(bn);
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
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
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-off-white/5"
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
                <div className="flex shrink-0 gap-1 font-body text-[11px] text-off-white/40">
                  <span title={mic ? "Mic on" : "Mic off"}>{mic ? "Mic" : "Mic off"}</span>
                  <span aria-hidden>·</span>
                  <span title={cam ? "Camera on" : "Camera off"}>{cam ? "Cam" : "Cam off"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="border-t border-off-white/10 px-3 py-2 font-body text-xs text-off-white/40">
        {sorted.length} in room
      </p>
    </div>
  );
}

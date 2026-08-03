"use client";

import { useEffect, useState } from "react";
import {
  ParticipantContextIfNeeded,
  ParticipantName,
  TrackRefContextIfNeeded,
  VideoTrack,
  isTrackReference,
  useEnsureTrackRef,
  useIsMuted,
  useIsSpeaking,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { ParticipantEvent, Track } from "livekit-client";
import { parseWebinarParticipantMeta } from "@/lib/webinarParticipantMeta";
import MemberAvatar from "@/components/MemberAvatar";

/**
 * Stage tile that shows the webinar avatar (from LiveKit metadata) when the
 * camera is off, and glows while the participant is speaking.
 */
export default function WebinarParticipantTile({
  trackRef,
}: {
  trackRef?: TrackReferenceOrPlaceholder;
}) {
  const trackReference = useEnsureTrackRef(trackRef);
  const { participant, source } = trackReference;
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = useIsMuted(trackReference);
  const [metaTick, setMetaTick] = useState(0);

  useEffect(() => {
    const onMeta = () => setMetaTick((n) => n + 1);
    participant.on(ParticipantEvent.ParticipantMetadataChanged, onMeta);
    return () => {
      participant.off(ParticipantEvent.ParticipantMetadataChanged, onMeta);
    };
  }, [participant]);

  void metaTick;
  const meta = parseWebinarParticipantMeta(participant.metadata);
  const avatarUrl = meta.avatarUrl || null;
  const display = participant.name || participant.identity;
  const initial = display.replace(/^@/, "").charAt(0).toUpperCase() || "?";

  const isScreenShare = source === Track.Source.ScreenShare;
  const hasLiveVideo =
    isTrackReference(trackReference) &&
    Boolean(trackReference.publication?.track) &&
    !isMuted &&
    (isScreenShare || participant.isCameraEnabled);

  return (
    <TrackRefContextIfNeeded trackRef={trackReference}>
      <ParticipantContextIfNeeded participant={participant}>
        <div
          className={`lk-participant-tile relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-[#1a1a1a] transition-[box-shadow,border-color] duration-150 ${
            isSpeaking
              ? "border-orange shadow-[0_0_0_2px_rgba(253,72,2,0.85),0_0_28px_rgba(253,72,2,0.55)]"
              : "border-off-white/10 shadow-none"
          }`}
          data-lk-speaking={isSpeaking ? "true" : "false"}
        >
          {hasLiveVideo ? (
            <VideoTrack
              trackRef={trackReference}
              className={`h-full w-full ${
                isScreenShare ? "object-contain bg-black" : "object-cover"
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#222] to-[#111] px-4">
              <div
                className={`rounded-full transition-[box-shadow] duration-150 ${
                  isSpeaking
                    ? "shadow-[0_0_0_3px_rgba(253,72,2,0.9),0_0_36px_rgba(253,72,2,0.65)]"
                    : ""
                }`}
              >
                <MemberAvatar
                  avatarUrl={avatarUrl}
                  initial={initial}
                  size={isScreenShare ? 72 : 112}
                  textSize={isScreenShare ? "text-2xl" : "text-4xl"}
                />
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8">
            <ParticipantName className="truncate font-body text-xs font-medium text-off-white drop-shadow" />
            {isSpeaking && (
              <span className="shrink-0 rounded bg-orange/90 px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-charcoal">
                Talking
              </span>
            )}
          </div>
        </div>
      </ParticipantContextIfNeeded>
    </TrackRefContextIfNeeded>
  );
}

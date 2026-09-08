"use client";

import { useEffect, useState } from "react";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { isAppleWebinarClient } from "@/lib/webinarApple";

/** Safari / iOS mute remote audio until a tap. Show a banner until playback is allowed. */
export function WebinarSoundUnlock() {
  const room = useRoomContext();
  const [blocked, setBlocked] = useState(() => !room.canPlaybackAudio);

  useEffect(() => {
    const sync = () => setBlocked(!room.canPlaybackAudio);
    sync();
    room.on(RoomEvent.AudioPlaybackStatusChanged, sync);
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, sync);
    };
  }, [room]);

  if (!blocked) return null;

  return (
    <button
      type="button"
      onClick={() => void room.startAudio()}
      className="fixed inset-x-0 top-0 z-[80] bg-orange px-4 py-3 text-center font-body text-sm font-semibold text-charcoal shadow-glow"
    >
      Tap to enable sound
    </button>
  );
}

/** iPhone / Safari often fail to publish mic if capture starts on page load. Prompt after a tap. */
export function WebinarApplePublishPrompt({ canPublish }: { canPublish: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const [apple] = useState(() => isAppleWebinarClient());

  if (!canPublish || !apple || asked) return null;
  if (localParticipant.isMicrophoneEnabled || localParticipant.isCameraEnabled) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          try {
            await localParticipant.setMicrophoneEnabled(true);
            await localParticipant.setCameraEnabled(true);
            setAsked(true);
          } finally {
            setBusy(false);
          }
        })();
      }}
      className="rounded-lg bg-orange px-3 py-1.5 font-body text-sm font-semibold text-charcoal shadow-glow disabled:opacity-60"
    >
      {busy ? "Enabling…" : "Tap to turn on mic & camera"}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  GridLayout,
  LayoutContextProvider,
  ParticipantTile,
  isTrackReference,
  useCreateLayoutContext,
  usePinnedTracks,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import {
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from "livekit-client";

export type StageLayoutMode = "auto" | "grid" | "focus";

const MAX_STAGE_CAMERAS = 4;

function isOnStage(track: TrackReferenceOrPlaceholder): boolean {
  if (track.source === Track.Source.ScreenShare) {
    return isTrackReference(track) && Boolean(track.publication);
  }
  let role = "audience";
  try {
    role =
      (JSON.parse(track.participant.metadata || "{}") as { role?: string }).role || "audience";
  } catch {
    // ignore bad metadata
  }
  return (
    role === "host" ||
    role === "speaker" ||
    Boolean(track.participant.permissions?.canPublish)
  );
}

function trackKey(track: TrackReferenceOrPlaceholder) {
  const sid = isTrackReference(track) ? track.publication?.trackSid : undefined;
  return `${track.participant.identity}-${track.source}-${sid ?? "placeholder"}`;
}

function sameTrack(
  a: TrackReferenceOrPlaceholder | undefined,
  b: TrackReferenceOrPlaceholder | undefined
) {
  if (!a || !b) return false;
  return trackKey(a) === trackKey(b);
}

function ensureSubscribed(track: TrackReferenceOrPlaceholder) {
  if (!isTrackReference(track) || track.participant.isLocal) return;
  const pub = track.publication as RemoteTrackPublication | undefined;
  if (pub && !pub.isSubscribed) {
    pub.setSubscribed(true);
  }
}

export default function WebinarStage({ layoutMode }: { layoutMode: StageLayoutMode }) {
  const room = useRoomContext();
  const layoutContext = useCreateLayoutContext();
  const lastAutoPinnedSid = useRef<string | null>(null);
  // Bump when a remote screen share is published so already-connected viewers
  // re-render/subscribe without needing a full page refresh.
  const [shareEpoch, setShareEpoch] = useState(0);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const stageTracks = useMemo(() => tracks.filter(isOnStage), [tracks, shareEpoch]);

  const screenShares = useMemo(
    () =>
      stageTracks.filter(
        (t) =>
          t.source === Track.Source.ScreenShare &&
          isTrackReference(t) &&
          Boolean(t.publication)
      ),
    [stageTracks]
  );

  const cameras = useMemo(
    () =>
      stageTracks
        .filter((t) => t.source === Track.Source.Camera)
        .slice(0, MAX_STAGE_CAMERAS),
    [stageTracks]
  );

  // Subscribe immediately when a remote screen share is published mid-session.
  // Without this, viewers already in the room often only see it after refresh.
  useEffect(() => {
    const onPublished = (
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (
        publication.source === Track.Source.ScreenShare ||
        publication.source === Track.Source.ScreenShareAudio
      ) {
        if (!publication.isSubscribed) {
          publication.setSubscribed(true);
        }
        setShareEpoch((n) => n + 1);
        void participant;
      }
    };

    const onUnpublished = (publication: RemoteTrackPublication) => {
      if (
        publication.source === Track.Source.ScreenShare ||
        publication.source === Track.Source.ScreenShareAudio
      ) {
        setShareEpoch((n) => n + 1);
      }
    };

    room.on(RoomEvent.TrackPublished, onPublished);
    room.on(RoomEvent.TrackUnpublished, onUnpublished);

    // Catch shares that were already published before this effect attached.
    Array.from(room.remoteParticipants.values()).forEach((participant) => {
      Array.from(participant.trackPublications.values()).forEach((publication) => {
        if (
          (publication.source === Track.Source.ScreenShare ||
            publication.source === Track.Source.ScreenShareAudio) &&
          !publication.isSubscribed
        ) {
          publication.setSubscribed(true);
        }
      });
    });

    return () => {
      room.off(RoomEvent.TrackPublished, onPublished);
      room.off(RoomEvent.TrackUnpublished, onUnpublished);
    };
  }, [room]);

  // Viewers must explicitly subscribe — local host always sees their own share.
  useEffect(() => {
    for (const share of screenShares) {
      ensureSubscribed(share);
    }
  }, [screenShares, shareEpoch]);

  // Auto-pin screen share (LiveKit VideoConference pattern); honor host layout mode.
  useEffect(() => {
    const dispatch = layoutContext.pin.dispatch;
    if (!dispatch) return;

    if (layoutMode === "grid") {
      if (lastAutoPinnedSid.current) {
        dispatch({ msg: "clear_pin" });
        lastAutoPinnedSid.current = null;
      }
      return;
    }

    const share = screenShares[0];
    if (share && isTrackReference(share)) {
      ensureSubscribed(share);
      const sid = share.publication.trackSid;
      if (lastAutoPinnedSid.current !== sid) {
        dispatch({ msg: "set_pin", trackReference: share });
        lastAutoPinnedSid.current = sid;
      }
      return;
    }

    if (layoutMode === "focus" && cameras[0]) {
      const key = trackKey(cameras[0]);
      if (lastAutoPinnedSid.current !== key) {
        dispatch({ msg: "set_pin", trackReference: cameras[0] });
        lastAutoPinnedSid.current = key;
      }
      return;
    }

    if (lastAutoPinnedSid.current) {
      dispatch({ msg: "clear_pin" });
      lastAutoPinnedSid.current = null;
    }
  }, [layoutMode, layoutContext.pin.dispatch, screenShares, cameras]);

  const pinnedTracks = usePinnedTracks(layoutContext);

  // Don't rely on pin state alone — pin can lag a frame, which previously
  // dropped viewers into a camera-only grid and hid the screen share.
  const focusTrack =
    layoutMode === "grid"
      ? undefined
      : pinnedTracks[0] ?? screenShares[0] ?? (layoutMode === "focus" ? cameras[0] : undefined);

  const showFocus = Boolean(focusTrack) && layoutMode !== "grid";

  const carouselTracks = useMemo(() => {
    const pool = [...cameras, ...screenShares];
    if (!focusTrack || !showFocus) return pool;
    return pool.filter((t) => !sameTrack(t, focusTrack));
  }, [cameras, screenShares, focusTrack, showFocus]);

  const gridTracks = useMemo(() => {
    // Always include active screen shares in grid mode / fallback.
    if (screenShares.length > 0) {
      return [...screenShares, ...cameras].slice(0, MAX_STAGE_CAMERAS + screenShares.length);
    }
    return cameras;
  }, [screenShares, cameras]);

  if (cameras.length === 0 && screenShares.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center rounded-xl border border-off-white/10 bg-charcoal/60">
        <p className="font-body text-sm text-off-white/50">Waiting for the host to go on camera…</p>
      </div>
    );
  }

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="h-full min-h-[50vh] overflow-hidden rounded-xl border border-off-white/10 bg-black [&_.lk-participant-tile]:rounded-lg [&_.lk-participant-tile]:border [&_.lk-participant-tile]:border-off-white/10">
        {showFocus && focusTrack ? (
          <div className="lk-focus-layout-wrapper h-full min-h-[50vh]">
            <FocusLayoutContainer className="h-full">
              <CarouselLayout tracks={carouselTracks}>
                <ParticipantTile />
              </CarouselLayout>
              <FocusLayout trackRef={focusTrack} />
            </FocusLayoutContainer>
          </div>
        ) : (
          <div className="lk-grid-layout-wrapper h-full min-h-[50vh]">
            <GridLayout tracks={gridTracks.length > 0 ? gridTracks : stageTracks}>
              <ParticipantTile />
            </GridLayout>
          </div>
        )}
      </div>
    </LayoutContextProvider>
  );
}

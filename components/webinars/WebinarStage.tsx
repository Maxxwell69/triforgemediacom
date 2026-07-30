"use client";

import { useEffect, useMemo, useRef } from "react";
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
  useTracks,
} from "@livekit/components-react";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-react";
import { Track } from "livekit-client";

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

export default function WebinarStage({ layoutMode }: { layoutMode: StageLayoutMode }) {
  const layoutContext = useCreateLayoutContext();
  const lastAutoPinnedSid = useRef<string | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const stageTracks = useMemo(() => tracks.filter(isOnStage), [tracks]);

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
  }, [
    layoutMode,
    layoutContext.pin.dispatch,
    screenShares.map((t) => (isTrackReference(t) ? t.publication.trackSid : "")).join(),
    cameras.map((t) => trackKey(t)).join(),
  ]);

  const pinnedTracks = usePinnedTracks(layoutContext);
  const focusTrack = pinnedTracks[0];

  const showFocus =
    layoutMode === "focus" ||
    (layoutMode === "auto" && Boolean(focusTrack)) ||
    (layoutMode !== "grid" && screenShares.length > 0 && Boolean(focusTrack));

  const carouselTracks = useMemo(() => {
    const pool =
      layoutMode === "grid"
        ? [...screenShares, ...cameras]
        : [...cameras, ...screenShares];
    if (!focusTrack || !showFocus) return pool;
    return pool.filter((t) => !sameTrack(t, focusTrack));
  }, [cameras, screenShares, focusTrack, showFocus, layoutMode]);

  const gridTracks = useMemo(() => {
    if (layoutMode === "grid" && screenShares.length > 0) {
      return [...screenShares, ...cameras].slice(0, MAX_STAGE_CAMERAS + 1);
    }
    return cameras;
  }, [layoutMode, screenShares, cameras]);

  if (cameras.length === 0 && screenShares.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-off-white/10 bg-charcoal/60">
        <p className="font-body text-sm text-off-white/50">Waiting for the host to go on camera…</p>
      </div>
    );
  }

  return (
    <LayoutContextProvider value={layoutContext}>
      <div className="h-full min-h-0 overflow-hidden rounded-xl border border-off-white/10 bg-black [&_.lk-participant-tile]:rounded-lg [&_.lk-participant-tile]:border [&_.lk-participant-tile]:border-off-white/10">
        {showFocus && focusTrack ? (
          <div className="lk-focus-layout-wrapper h-full">
            <FocusLayoutContainer>
              <CarouselLayout tracks={carouselTracks}>
                <ParticipantTile />
              </CarouselLayout>
              <FocusLayout trackRef={focusTrack} />
            </FocusLayoutContainer>
          </div>
        ) : (
          <div className="lk-grid-layout-wrapper h-full">
            <GridLayout tracks={gridTracks.length > 0 ? gridTracks : stageTracks}>
              <ParticipantTile />
            </GridLayout>
          </div>
        )}
      </div>
    </LayoutContextProvider>
  );
}

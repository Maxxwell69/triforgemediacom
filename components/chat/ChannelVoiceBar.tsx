"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_VOICE_PEERS } from "@/lib/voiceConstants";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
const POLL_MS = 1500;

type VoicePeer = {
  userId: string;
  displayName: string;
  muted: boolean;
};

type VoiceSignal = {
  id: string;
  fromUserId: string;
  kind: "offer" | "answer" | "ice" | string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, unknown>;
};

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 8.8a4.5 4.5 0 0 1 0 6.4M17.8 6.2a8 8 0 0 1 0 11.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ChannelVoiceBar({
  channelId,
  currentUserId,
  selfName,
}: {
  channelId: string;
  currentUserId: string;
  selfName: string;
}) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<VoicePeer[]>([]);

  const joinedRef = useRef(false);
  const joiningRef = useRef(false);
  const stayOutRef = useRef(false);
  const mutedRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef(new Map<string, RTCPeerConnection>());
  const makingOfferRef = useRef(new Map<string, boolean>());
  const ignoreOfferRef = useRef(new Map<string, boolean>());
  const audioElsRef = useRef(new Map<string, HTMLAudioElement>());
  const audioHostRef = useRef<HTMLDivElement | null>(null);

  const postVoice = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/voice/${channelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        peers?: VoicePeer[];
      };
      if (!res.ok) {
        throw new Error(data.error || "Voice request failed.");
      }
      return data;
    },
    [channelId]
  );

  const sendSignal = useCallback(
    async (toUserId: string, kind: string, payload: unknown) => {
      await postVoice({ action: "signal", toUserId, kind, payload });
    },
    [postVoice]
  );

  const dropPeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    makingOfferRef.current.delete(peerId);
    ignoreOfferRef.current.delete(peerId);
    const audio = audioElsRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      audioElsRef.current.delete(peerId);
    }
  }, []);

  const attachRemoteAudio = useCallback((peerId: string, stream: MediaStream) => {
    const host = audioHostRef.current;
    if (!host) return;
    let audio = audioElsRef.current.get(peerId);
    if (!audio) {
      audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      host.appendChild(audio);
      audioElsRef.current.set(peerId, audio);
    }
    audio.srcObject = stream;
    void audio.play().catch(() => {});
  }, []);

  const ensurePc = useCallback(
    (peerId: string) => {
      const existing = pcsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const local = localStreamRef.current;
      if (local) {
        for (const track of local.getTracks()) {
          pc.addTrack(track, local);
        }
      }

      pc.onicecandidate = (event) => {
        if (!event.candidate || !joinedRef.current) return;
        void sendSignal(peerId, "ice", event.candidate.toJSON()).catch(() => {});
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        attachRemoteAudio(peerId, stream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          dropPeer(peerId);
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current.set(peerId, true);
          await pc.setLocalDescription(await pc.createOffer());
          if (pc.localDescription) {
            await sendSignal(peerId, "offer", {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            });
          }
        } catch {
          // Glare / closed — next poll retries.
        } finally {
          makingOfferRef.current.set(peerId, false);
        }
      };

      pcsRef.current.set(peerId, pc);
      return pc;
    },
    [attachRemoteAudio, dropPeer, sendSignal]
  );

  const handleSignal = useCallback(
    async (signal: VoiceSignal) => {
      if (signal.fromUserId === currentUserId) return;
      const pc = ensurePc(signal.fromUserId);
      const polite = currentUserId > signal.fromUserId;

      if (signal.kind === "offer") {
        const desc = signal.payload as RTCSessionDescriptionInit;
        const colliding =
          makingOfferRef.current.get(signal.fromUserId) === true || pc.signalingState !== "stable";
        ignoreOfferRef.current.set(signal.fromUserId, !polite && colliding);
        if (ignoreOfferRef.current.get(signal.fromUserId)) return;
        if (colliding) {
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" }),
            pc.setRemoteDescription(desc),
          ]);
        } else {
          await pc.setRemoteDescription(desc);
        }
        await pc.setLocalDescription(await pc.createAnswer());
        if (pc.localDescription) {
          await sendSignal(signal.fromUserId, "answer", {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          });
        }
        return;
      }

      if (signal.kind === "answer") {
        if (ignoreOfferRef.current.get(signal.fromUserId)) return;
        await pc.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        return;
      }

      if (signal.kind === "ice") {
        try {
          await pc.addIceCandidate(signal.payload as RTCIceCandidateInit);
        } catch {
          if (!ignoreOfferRef.current.get(signal.fromUserId)) {
            // Candidate arrived before remote description; ignore.
          }
        }
      }
    },
    [currentUserId, ensurePc, sendSignal]
  );

  const stopLocal = useCallback(() => {
    joinedRef.current = false;
    for (const peerId of Array.from(pcsRef.current.keys())) {
      dropPeer(peerId);
    }
    const local = localStreamRef.current;
    if (local) {
      for (const track of local.getTracks()) track.stop();
      localStreamRef.current = null;
    }
  }, [dropPeer]);

  const leave = useCallback(async () => {
    stayOutRef.current = true;
    stopLocal();
    setJoined(false);
    setError(null);
    try {
      await postVoice({ action: "leave" });
    } catch {
      // Best-effort; occupancy expires on heartbeat timeout.
    }
  }, [postVoice, stopLocal]);

  const join = useCallback(async () => {
    if (joinedRef.current || joiningRef.current) return;
    joiningRef.current = true;
    stayOutRef.current = false;
    setBusy(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !mutedRef.current;
      });
      const data = await postVoice({
        action: "join",
        muted: mutedRef.current,
        displayName: selfName,
      });
      joinedRef.current = true;
      setJoined(true);
      const nextPeers = data.peers ?? [];
      setPeers(nextPeers);
      for (const peer of nextPeers) {
        if (peer.userId !== currentUserId) ensurePc(peer.userId);
      }
    } catch (err) {
      stopLocal();
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone permission is required to join voice."
          : err instanceof Error
            ? err.message
            : "Could not join voice.";
      setError(message);
    } finally {
      joiningRef.current = false;
      setBusy(false);
    }
  }, [currentUserId, ensurePc, postVoice, selfName, stopLocal]);

  // Discord-style: opening the room joins voice. Leave stays in text until you re-enter.
  useEffect(() => {
    if (stayOutRef.current) return;
    void join();
  }, [channelId, join]);

  const toggleMute = useCallback(async () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    if (joinedRef.current) {
      try {
        await postVoice({ action: "heartbeat", muted: next });
      } catch {
        // occupancy still updates on the next poll heartbeat
      }
    }
  }, [postVoice]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(`/api/voice/${channelId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { peers?: VoicePeer[]; signals?: VoiceSignal[] };
        if (cancelled) return;
        const nextPeers = data.peers ?? [];
        setPeers(nextPeers);

        if (!joinedRef.current) return;

        const liveIds = new Set(nextPeers.map((p) => p.userId));
        for (const peerId of Array.from(pcsRef.current.keys())) {
          if (!liveIds.has(peerId)) dropPeer(peerId);
        }
        for (const peer of nextPeers) {
          if (peer.userId !== currentUserId) ensurePc(peer.userId);
        }
        for (const signal of data.signals ?? []) {
          await handleSignal(signal).catch(() => {});
        }
        await postVoice({ action: "heartbeat", muted: mutedRef.current }).catch(() => {});
      } catch {
        // ignore transient poll errors
      }
    }

    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [channelId, currentUserId, dropPeer, ensurePc, handleSignal, postVoice]);

  useEffect(() => {
    function onPageHide() {
      if (!joinedRef.current) return;
      stopLocal();
      const payload = JSON.stringify({ action: "leave" });
      try {
        navigator.sendBeacon(`/api/voice/${channelId}`, new Blob([payload], { type: "application/json" }));
      } catch {
        void fetch(`/api/voice/${channelId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      if (joinedRef.current) {
        stopLocal();
        void postVoice({ action: "leave" });
      }
    };
  }, [channelId, postVoice, stopLocal]);

  const others = peers.filter((p) => p.userId !== currentUserId);
  const selfInRoom = peers.some((p) => p.userId === currentUserId);
  const count = peers.length;

  return (
    <div className="mt-3 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-3 py-2.5">
      <div ref={audioHostRef} className="hidden" aria-hidden />
      <div className="flex flex-wrap items-center gap-2">
        <SpeakerIcon className={`h-4 w-4 ${joined ? "text-cyan" : "text-off-white/50"}`} />
        <p className="font-body text-sm text-off-white/80">
          {joined ? "Connected" : busy ? "Connecting…" : "Voice"}
          <span className="text-off-white/40">
            {" "}
            · {count}/{MAX_VOICE_PEERS}
          </span>
        </p>
        {joined ? (
          <>
            <button
              type="button"
              onClick={() => void toggleMute()}
              className={`rounded-lg border px-3 py-1 font-body text-xs font-semibold transition ${
                muted
                  ? "border-orange/50 text-orange hover:bg-orange/10"
                  : "border-off-white/20 text-off-white/80 hover:border-cyan/40 hover:text-cyan"
              }`}
            >
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => void leave()}
              className="rounded-lg border border-off-white/20 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-orange/40 hover:text-orange"
            >
              Leave
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy || count >= MAX_VOICE_PEERS}
            onClick={() => void join()}
            className="rounded-lg bg-cyan/90 px-3 py-1 font-body text-xs font-semibold text-charcoal transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Joining…" : count >= MAX_VOICE_PEERS ? "Full" : "Join voice"}
          </button>
        )}
      </div>
      {(joined || selfInRoom || others.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(joined ? [{ userId: currentUserId, displayName: selfName, muted }, ...others] : peers).map(
            (peer) => (
              <span
                key={peer.userId}
                className="inline-flex items-center gap-1 rounded-full border border-off-white/15 px-2 py-0.5 font-body text-[11px] text-off-white/70"
              >
                {peer.userId === currentUserId ? "You" : peer.displayName}
                {peer.muted ? <span className="text-orange/80">muted</span> : null}
              </span>
            )
          )}
        </div>
      )}
      {error && <p className="mt-2 font-body text-xs text-orange">{error}</p>}
    </div>
  );
}

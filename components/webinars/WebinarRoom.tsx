"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import "@livekit/components-styles";
import type { WebinarParticipantRole } from "@prisma/client";
import WebinarChat from "@/components/webinars/WebinarChat";
import WebinarStage, { type StageLayoutMode } from "@/components/webinars/WebinarStage";

type StageRequest = {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
};

const LAYOUT_OPTIONS: { id: StageLayoutMode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "grid", label: "Grid" },
  { id: "focus", label: "Focus" },
];

function HostStagePanel({
  webinarId,
  isHost,
}: {
  webinarId: string;
  isHost: boolean;
}) {
  const [requests, setRequests] = useState<StageRequest[]>([]);
  const room = useRoomContext();

  useEffect(() => {
    if (!isHost) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/webinars/${webinarId}/stage-request`);
        if (!res.ok) return;
        const data = (await res.json()) as { requests: StageRequest[] };
        if (!cancelled) setRequests(data.requests);
      } catch {
        // ignore
      }
    }

    void poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [webinarId, isHost]);

  async function invite(userId: string, approve: boolean) {
    await fetch(`/api/webinars/${webinarId}/stage-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, approve }),
    });
    setRequests((prev) => prev.filter((r) => r.user.id !== userId));
  }

  if (!isHost) return null;

  return (
    <div className="rounded-xl border border-off-white/10 bg-charcoal/50 p-3">
      <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
        Raise hand ({requests.length})
      </p>
      {requests.length === 0 ? (
        <p className="mt-2 font-body text-xs text-off-white/40">No pending requests</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2">
              <span className="truncate font-body text-sm text-off-white/80">
                {r.user.name || r.user.email}
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => void invite(r.user.id, true)}
                  className="rounded bg-orange px-2 py-1 font-body text-xs font-semibold text-charcoal"
                >
                  Invite
                </button>
                <button
                  type="button"
                  onClick={() => void invite(r.user.id, false)}
                  className="rounded border border-off-white/20 px-2 py-1 font-body text-xs text-off-white/60"
                >
                  Deny
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 font-body text-[11px] text-off-white/30">
        Room: {room.name} · {room.numParticipants} in call
      </p>
    </div>
  );
}

function AudienceControls({
  webinarId,
  role,
  onRoleChange,
}: {
  webinarId: string;
  role: WebinarParticipantRole;
  onRoleChange: (role: WebinarParticipantRole) => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [raising, setRaising] = useState(false);
  const [raised, setRaised] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onPerms = () => {
      if (localParticipant.permissions?.canPublish && role === "AUDIENCE") {
        onRoleChange("SPEAKER");
      }
    };
    room.on(RoomEvent.ParticipantPermissionsChanged, onPerms);
    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, onPerms);
    };
  }, [room, localParticipant, role, onRoleChange]);

  async function raiseHand() {
    setRaising(true);
    setError(null);
    try {
      const res = await fetch(`/api/webinars/${webinarId}/stage-request`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not raise hand");
        return;
      }
      setRaised(true);
    } catch {
      setError("Could not raise hand");
    } finally {
      setRaising(false);
    }
  }

  if (role === "HOST" || role === "SPEAKER") {
    return (
      <p className="font-body text-xs text-cyan">
        You can publish camera/mic. Use the controls below.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={raising || raised}
        onClick={() => void raiseHand()}
        className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/15 disabled:opacity-50"
      >
        {raised ? "Hand raised — waiting for host" : raising ? "Raising…" : "Raise hand"}
      </button>
      {error && <p className="mt-1 font-body text-xs text-orange">{error}</p>}
    </div>
  );
}

function RoomChrome({
  webinarId,
  title,
  status,
  isHost,
  role,
  onRoleChange,
  onStart,
  onEnd,
}: {
  webinarId: string;
  title: string;
  status: string;
  isHost: boolean;
  role: WebinarParticipantRole;
  onRoleChange: (role: WebinarParticipantRole) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const participants = useParticipants();
  const canPublish = role === "HOST" || role === "SPEAKER";
  const [layoutMode, setLayoutMode] = useState<StageLayoutMode>("auto");

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link
              href="/webinars"
              className="font-body text-xs text-off-white/40 hover:text-off-white/70"
            >
              ← Leave
            </Link>
            <h1 className="font-display text-2xl tracking-wide text-off-white">{title}</h1>
            <p className="font-body text-xs text-off-white/50">
              {status === "LIVE" ? (
                <span className="text-orange">● LIVE</span>
              ) : (
                <span className="text-cyan">Lobby</span>
              )}{" "}
              · {participants.length} here
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isHost && (
              <div
                className="flex rounded-lg border border-off-white/15 p-0.5"
                role="group"
                aria-label="Stage layout"
              >
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLayoutMode(opt.id)}
                    className={`rounded-md px-2.5 py-1 font-body text-xs font-semibold transition ${
                      layoutMode === opt.id
                        ? "bg-orange text-charcoal"
                        : "text-off-white/50 hover:text-off-white/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            {isHost && status !== "LIVE" && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-lg bg-orange px-3 py-1.5 font-body text-sm font-semibold text-charcoal shadow-glow"
              >
                Start webinar
              </button>
            )}
            {isHost && status === "LIVE" && (
              <button
                type="button"
                onClick={onEnd}
                className="rounded-lg border border-off-white/20 px-3 py-1.5 font-body text-sm text-off-white/70"
              >
                End webinar
              </button>
            )}
            <AudienceControls
              webinarId={webinarId}
              role={role}
              onRoleChange={onRoleChange}
            />
          </div>
        </div>

        <div className="min-h-[50vh] flex-1">
          <WebinarStage layoutMode={layoutMode} />
        </div>

        {isHost && <HostStagePanel webinarId={webinarId} isHost={isHost} />}

        <ControlBar
          controls={{
            camera: canPublish,
            microphone: canPublish,
            screenShare: canPublish && isHost,
            leave: false,
          }}
        />
      </div>

      <div className="h-72 shrink-0 lg:h-auto lg:w-80 xl:w-96">
        <WebinarChat webinarId={webinarId} canSend />
      </div>
    </div>
  );
}

export default function WebinarRoom({
  webinarId,
  title,
  status: initialStatus,
  initialRole,
  isHost,
  joinMode,
  userId,
  userName,
}: {
  webinarId: string;
  title: string;
  status: string;
  initialRole: WebinarParticipantRole;
  isHost: boolean;
  joinMode?: "host" | "watch" | null;
  userId: string;
  userName: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [role, setRole] = useState<WebinarParticipantRole>(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/webinars/${webinarId}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinMode ? { mode: joinMode } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join room");
        setToken(null);
        return;
      }
      setToken(data.token);
      setServerUrl(data.url);
      setRole(data.role);
    } catch {
      setError("Could not join room");
    } finally {
      setLoading(false);
    }
  }, [webinarId, joinMode]);

  useEffect(() => {
    void fetchToken();
  }, [fetchToken]);

  // When promoted to speaker, remint token so publish grants are present even if
  // LiveKit permission update raced before they connected.
  useEffect(() => {
    if (role === "SPEAKER" || role === "HOST") {
      // no-op: permission updates via RoomService are enough when already connected
    }
  }, [role]);

  async function handleStart() {
    const res = await fetch(`/api/webinars/${webinarId}/start`, { method: "POST" });
    if (res.ok) setStatus("LIVE");
  }

  async function handleEnd() {
    if (!confirm("End this webinar for everyone?")) return;
    const res = await fetch(`/api/webinars/${webinarId}/end`, { method: "POST" });
    if (res.ok) {
      setStatus("ENDED");
      window.location.href = `/webinars/${webinarId}`;
    }
  }

  function handleRoleChange(next: WebinarParticipantRole) {
    setRole(next);
    if (next === "SPEAKER") {
      void fetchToken();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <p className="font-body text-off-white/60">Connecting to room…</p>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
        <p className="font-body text-orange">{error || "Unable to join"}</p>
        <button
          type="button"
          onClick={() => void fetchToken()}
          className="rounded-lg border border-off-white/20 px-4 py-2 font-body text-sm text-off-white/70"
        >
          Retry
        </button>
        <Link href="/webinars" className="font-body text-sm text-cyan hover:underline">
          Back to webinars
        </Link>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={`${token.slice(0, 24)}-${role}`}
      token={token}
      serverUrl={serverUrl}
      connect
      audio={role === "HOST" || role === "SPEAKER"}
      video={role === "HOST" || role === "SPEAKER"}
      // Keep stage tracks subscribed for all viewers (screen share was easy to miss
      // with adaptiveStream when the focus tile had no laid-out size yet).
      options={{ adaptiveStream: false, dynacast: true }}
      data-lk-theme="default"
      className="flex min-h-0 flex-1 flex-col bg-charcoal"
      style={{ height: "100%" }}
    >
      <RoomAudioRenderer />
      <RoomChrome
        webinarId={webinarId}
        title={title}
        status={status}
        isHost={isHost}
        role={role}
        onRoleChange={handleRoleChange}
        onStart={() => void handleStart()}
        onEnd={() => void handleEnd()}
      />
      <span className="sr-only">
        {userName} ({userId})
      </span>
    </LiveKitRoom>
  );
}

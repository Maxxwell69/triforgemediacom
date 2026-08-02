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
import { RoomEvent, DisconnectReason } from "livekit-client";
import "@livekit/components-styles";
import type { WebinarParticipantRole } from "@prisma/client";
import WebinarSidePanel from "@/components/webinars/WebinarSidePanel";
import WebinarStage, { type StageLayoutMode } from "@/components/webinars/WebinarStage";
import {
  useWebinarLeaveGuard,
  WebinarLeaveLink,
} from "@/components/webinars/WebinarLeaveGuard";

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
      <p className="mt-2 truncate font-body text-[11px] text-off-white/30" title={room.name ?? undefined}>
        {room.numParticipants} in call
        {room.name ? (
          <span className="ml-1 text-off-white/20">· {room.name}</span>
        ) : null}
      </p>
    </div>
  );
}

function KickWatcher({ onKicked }: { onKicked: () => void }) {
  const room = useRoomContext();
  useEffect(() => {
    const onDisconnected = (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        onKicked();
      }
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, onKicked]);
  return null;
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
      const canPub = !!localParticipant.permissions?.canPublish;
      if (canPub && role === "AUDIENCE") {
        onRoleChange("SPEAKER");
      } else if (!canPub && (role === "SPEAKER" || role === "HOST")) {
        onRoleChange("AUDIENCE");
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
  role,
  onRoleChange,
  onStart,
  onEnd,
  currentUserId,
  designatedHostUserId,
}: {
  webinarId: string;
  title: string;
  status: string;
  role: WebinarParticipantRole;
  onRoleChange: (role: WebinarParticipantRole) => void;
  onStart: () => void;
  onEnd: () => void;
  currentUserId: string;
  designatedHostUserId: string;
}) {
  const participants = useParticipants();
  const canPublish = role === "HOST" || role === "SPEAKER";
  const hostPowers = role === "HOST";
  const canModerate = role === "HOST";
  const [layoutMode, setLayoutMode] = useState<StageLayoutMode>("auto");

  // Warn hosts before accidental leave / tab close while in the room.
  useWebinarLeaveGuard(hostPowers);

  return (
    <div className="flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-3 sm:gap-3 sm:p-4">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <WebinarLeaveLink
              href="/webinars"
              warn={hostPowers}
              className="font-body text-xs text-off-white/40 hover:text-off-white/70"
            >
              ← Leave
            </WebinarLeaveLink>
            <h1 className="truncate font-display text-xl tracking-wide text-off-white sm:text-2xl">
              {title}
            </h1>
            <p className="font-body text-xs text-off-white/50">
              {status === "LIVE" ? (
                <span className="text-orange">● LIVE</span>
              ) : (
                <span className="text-cyan">Lobby</span>
              )}{" "}
              · {participants.length} here
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-2">
            {hostPowers && (
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
            {hostPowers && status !== "LIVE" && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-lg bg-orange px-3 py-1.5 font-body text-sm font-semibold text-charcoal shadow-glow"
              >
                Start webinar
              </button>
            )}
            {hostPowers && status === "LIVE" && (
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

        {/* Mobile: fixed stage height so LiveKit tiles don't collapse into a thin strip.
            Desktop: fill remaining column height. */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden lg:aspect-auto lg:min-h-0 lg:flex-1">
          <div className="absolute inset-0 lg:relative lg:h-full">
            <WebinarStage layoutMode={layoutMode} />
          </div>
        </div>

        <div className="shrink-0">
          <ControlBar
            controls={{
              camera: canPublish,
              microphone: canPublish,
              screenShare: canPublish && hostPowers,
              leave: false,
            }}
          />
        </div>

        {canModerate && (
          <div className="shrink-0">
            <HostStagePanel webinarId={webinarId} isHost={canModerate} />
          </div>
        )}
      </div>

      <div className="flex h-[32vh] max-h-64 min-h-44 shrink-0 flex-col overflow-hidden border-t border-off-white/10 lg:h-full lg:max-h-none lg:min-h-0 lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
        <WebinarSidePanel
          webinarId={webinarId}
          canSendChat
          canModerate={canModerate}
          currentUserId={currentUserId}
          designatedHostUserId={designatedHostUserId}
        />
      </div>
    </div>
  );
}

export default function WebinarRoom({
  webinarId,
  title,
  status: initialStatus,
  initialRole,
  joinMode,
  userId,
  userName,
  designatedHostUserId,
}: {
  webinarId: string;
  title: string;
  status: string;
  initialRole: WebinarParticipantRole;
  joinMode?: "host" | "watch" | null;
  userId: string;
  userName: string;
  designatedHostUserId: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [role, setRole] = useState<WebinarParticipantRole>(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kicked, setKicked] = useState(false);

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
    if (next === "SPEAKER" || next === "AUDIENCE") {
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

  if (kicked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10">
        <p className="font-body text-orange">You were removed from this webinar.</p>
        <Link href="/webinars" className="font-body text-sm text-cyan hover:underline">
          Back to webinars
        </Link>
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
      className="flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden bg-charcoal"
    >
      <RoomAudioRenderer />
      <KickWatcher onKicked={() => setKicked(true)} />
      <RoomChrome
        webinarId={webinarId}
        title={title}
        status={status}
        role={role}
        onRoleChange={handleRoleChange}
        onStart={() => void handleStart()}
        onEnd={() => void handleEnd()}
        currentUserId={userId}
        designatedHostUserId={designatedHostUserId}
      />
      <span className="sr-only">
        {userName} ({userId})
      </span>
    </LiveKitRoom>
  );
}

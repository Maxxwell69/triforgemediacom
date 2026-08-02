import "server-only";
import { AccessToken, RoomServiceClient, type VideoGrant } from "livekit-server-sdk";
import {
  buildWebinarParticipantMeta,
  type WebinarTokenRole,
} from "@/lib/webinarParticipantMeta";

export {
  buildWebinarParticipantMeta,
  parseWebinarParticipantMeta,
  type WebinarParticipantMeta,
  type WebinarTokenRole,
} from "@/lib/webinarParticipantMeta";

function requireLiveKitEnv() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    throw new Error(
      "LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET."
    );
  }
  // RoomServiceClient expects https://; client SDK uses wss:// from the same project URL.
  const httpUrl = url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
  return { apiKey, apiSecret, url, httpUrl };
}

export function isLiveKitConfigured() {
  return Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET
  );
}

export function getLiveKitUrl() {
  return requireLiveKitEnv().url;
}

export async function mintWebinarToken(opts: {
  identity: string;
  name: string;
  roomName: string;
  role: WebinarTokenRole;
  avatarUrl?: string | null;
}) {
  const { apiKey, apiSecret } = requireLiveKitEnv();
  const canPublish = opts.role === "host" || opts.role === "speaker";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    metadata: buildWebinarParticipantMeta({
      role: opts.role,
      avatarUrl: opts.avatarUrl,
    }),
    ttl: "6h",
  });

  const grant: VideoGrant = {
    roomJoin: true,
    room: opts.roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  };
  at.addGrant(grant);

  return at.toJwt();
}

function getRoomService() {
  const { apiKey, apiSecret, httpUrl } = requireLiveKitEnv();
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
}

/** Grant or revoke publish rights for a participant already in the room. */
export async function setParticipantPublish(opts: {
  roomName: string;
  identity: string;
  canPublish: boolean;
  metadata?: string;
}) {
  const roomService = getRoomService();
  await roomService.updateParticipant(opts.roomName, opts.identity, {
    permission: {
      canPublish: opts.canPublish,
      canSubscribe: true,
      canPublishData: true,
    },
    ...(opts.metadata ? { metadata: opts.metadata } : {}),
  });
}

/** Update LiveKit participant metadata without changing publish rights. */
export async function setParticipantMetadata(opts: {
  roomName: string;
  identity: string;
  metadata: string;
}) {
  const roomService = getRoomService();
  await roomService.updateParticipant(opts.roomName, opts.identity, {
    metadata: opts.metadata,
  });
}

/** Force-disconnect a participant from the LiveKit room. */
export async function removeParticipant(opts: { roomName: string; identity: string }) {
  const roomService = getRoomService();
  await roomService.removeParticipant(opts.roomName, opts.identity);
}

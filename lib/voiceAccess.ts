import { hubHas } from "@/lib/hub/modules";

export { MAX_VOICE_PEERS, VOICE_STALE_MS, isVoiceSignalKind } from "@/lib/voiceConstants";
export type { VoiceSignalKind } from "@/lib/voiceConstants";

/** Hub SKU + group allow + this room’s toggle. */
export function channelVoiceEnabled(channel: {
  hasVoice: boolean;
  groups: { grantsVoiceAccess: boolean }[];
}): boolean {
  if (!hubHas("voice")) return false;
  if (!channel.hasVoice) return false;
  return channel.groups.some((g) => g.grantsVoiceAccess);
}

import { hubHas } from "@/lib/hub/modules";

export { MAX_VOICE_PEERS, VOICE_STALE_MS, isVoiceSignalKind } from "@/lib/voiceConstants";
export type { VoiceSignalKind } from "@/lib/voiceConstants";

/** Voice SKU, or Chat (Create Hub communities created before Voice existed). */
export function hubVoiceAvailable(): boolean {
  return hubHas("voice") || hubHas("chat");
}

export function channelNameLooksLikeVoice(name: string | null | undefined): boolean {
  return /\bvoice\b/i.test((name ?? "").replace(/[-_]+/g, " "));
}

/** Hub can use voice, this room is marked (or named) voice, and a group allows it. */
export function channelVoiceEnabled(channel: {
  name?: string | null;
  hasVoice: boolean;
  groups: { grantsVoiceAccess: boolean; isHome?: boolean }[];
}): boolean {
  if (!hubVoiceAvailable()) return false;
  const marked = channel.hasVoice || channelNameLooksLikeVoice(channel.name);
  if (!marked) return false;
  if (channel.groups.length === 0) return true;
  return channel.groups.some((g) => g.grantsVoiceAccess || g.isHome);
}

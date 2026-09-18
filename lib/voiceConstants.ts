export const MAX_VOICE_PEERS = 8;
export const VOICE_STALE_MS = 20_000;
export const VOICE_SIGNAL_KINDS = ["offer", "answer", "ice"] as const;
export type VoiceSignalKind = (typeof VOICE_SIGNAL_KINDS)[number];

export function isVoiceSignalKind(value: string): value is VoiceSignalKind {
  return (VOICE_SIGNAL_KINDS as readonly string[]).includes(value);
}

/** Client-safe LiveKit participant metadata helpers (no server-only imports). */

export type WebinarTokenRole = "host" | "speaker" | "audience";

export type WebinarParticipantMeta = {
  role: WebinarTokenRole;
  avatarUrl?: string | null;
};

export function parseWebinarParticipantMeta(
  raw: string | undefined | null
): Partial<WebinarParticipantMeta> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<WebinarParticipantMeta>;
  } catch {
    return {};
  }
}

export function buildWebinarParticipantMeta(meta: WebinarParticipantMeta): string {
  return JSON.stringify({
    role: meta.role,
    ...(meta.avatarUrl ? { avatarUrl: meta.avatarUrl } : {}),
  });
}

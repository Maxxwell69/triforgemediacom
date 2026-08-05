import { isR2PublicUrl, mirrorRemoteImage } from "@/lib/r2";

/**
 * TikTok (and similar) CDN avatar URLs are signed with x-expires and stop
 * loading after a few days. Persist a copy on R2 when possible so member
 * avatars don't break between stats refreshes.
 */
export async function persistTikTokAvatarUrl(
  userId: string,
  remoteUrl: string | null | undefined
): Promise<string | null> {
  if (!remoteUrl) return null;
  if (isR2PublicUrl(remoteUrl)) return remoteUrl;

  const mirrored = await mirrorRemoteImage("member-avatars", remoteUrl, {
    fileStem: userId,
  });
  return mirrored ?? remoteUrl;
}

/** True when a TikTok-style signed CDN URL is expired or about to expire. */
export function isExpiredSignedAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isR2PublicUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const exp = parsed.searchParams.get("x-expires");
    if (!exp) return false;
    // Refresh an hour early so visitors don't hit a just-expired link.
    return Number(exp) * 1000 < Date.now() + 60 * 60 * 1000;
  } catch {
    return false;
  }
}

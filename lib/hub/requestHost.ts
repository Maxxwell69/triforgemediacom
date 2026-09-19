import { headers } from "next/headers";
import { hostnameFromHeaders, isCustomDomainCandidate, resolveHubHost } from "@/lib/hub/host";

const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Tenant slug for this request. Hostname wins.
 * A browser-sent x-hub-slug is ignored on Hub 0, Railway, localhost, and
 * reserved labels (staging, www, …). Only a real custom domain may use the
 * header — and only after middleware resolved that host.
 */
export function trustedClientSlug(headerStore: {
  get(name: string): string | null;
}): string | null {
  const hostname = hostnameFromHeaders(headerStore);
  const resolved = resolveHubHost(hostname);
  if (resolved.kind === "client") return resolved.slug;
  if (!isCustomDomainCandidate(hostname)) return null;
  const pinned = headerStore.get("x-hub-slug");
  if (pinned && SLUG_RE.test(pinned)) return pinned;
  return null;
}

export function clientSlugFromHeaders(): string | null {
  try {
    return trustedClientSlug(headers());
  } catch {
    return null;
  }
}

export function isClientHubRequest(): boolean {
  return clientSlugFromHeaders() != null;
}

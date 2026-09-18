import { headers } from "next/headers";
import { hostnameFromHeaders, resolveHubHost } from "@/lib/hub/host";

const SLUG_RE = /^[a-z0-9-]+$/;

export function clientSlugFromHeaders(): string | null {
  try {
    const h = headers();
    const pinned = h.get("x-hub-slug");
    if (pinned && SLUG_RE.test(pinned)) return pinned;
    const resolved = resolveHubHost(hostnameFromHeaders(h));
    return resolved.kind === "client" ? resolved.slug : null;
  } catch {
    return null;
  }
}

export function isClientHubRequest(): boolean {
  return clientSlugFromHeaders() != null;
}

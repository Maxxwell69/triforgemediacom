import { headers } from "next/headers";
import { hostnameFromHeaders, resolveHubHost } from "@/lib/hub/host";

export function clientSlugFromHeaders(): string | null {
  try {
    const resolved = resolveHubHost(hostnameFromHeaders(headers()));
    return resolved.kind === "client" ? resolved.slug : null;
  } catch {
    return null;
  }
}

export function isClientHubRequest(): boolean {
  return clientSlugFromHeaders() != null;
}

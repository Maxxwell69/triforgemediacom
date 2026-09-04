import { RESERVED_HUB_SLUGS } from "@/lib/hub/clientHubs";

export const HUB0_HOST = "hub.triforgemedia.com";
export const CLIENT_HUB_SUFFIX = ".hub.triforgemedia.com";

export type ResolvedHubHost =
  | { kind: "platform" }
  | { kind: "client"; slug: string };

function stripPort(host: string) {
  return host.replace(/:\d+$/, "").toLowerCase().trim();
}

export function hostnameFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-host");
  const raw = (forwarded?.split(",")[0] || headers.get("host") || "").trim();
  return stripPort(raw);
}

/**
 * Hub 0 stays on hub.triforgemedia.com, localhost, and Railway service domains.
 * `{slug}.hub.triforgemedia.com` is a client host — never serve Hub 0 there.
 * Reserved labels (staging, www, …) stay platform so staging.hub… is not a tenant.
 */
export function resolveHubHost(hostname: string): ResolvedHubHost {
  const host = stripPort(hostname);
  if (!host) return { kind: "platform" };
  if (host === HUB0_HOST) return { kind: "platform" };
  if (host === "localhost" || host === "127.0.0.1") return { kind: "platform" };
  if (host.endsWith(".up.railway.app") || host.endsWith(".railway.internal")) {
    return { kind: "platform" };
  }
  if (!host.endsWith(CLIENT_HUB_SUFFIX)) return { kind: "platform" };

  const slug = host.slice(0, -CLIENT_HUB_SUFFIX.length);
  if (!slug || slug.includes(".")) return { kind: "platform" };
  if (RESERVED_HUB_SLUGS.has(slug)) return { kind: "platform" };
  return { kind: "client", slug };
}

export function clientHubPublicHost(slug: string) {
  return `${slug}${CLIENT_HUB_SUFFIX}`;
}

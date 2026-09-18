import { RESERVED_HUB_SLUGS } from "@/lib/hub/clientHubs";

export const HUB0_HOST = "hub.triforgemedia.com";
export const CLIENT_HUB_SUFFIX = ".hub.triforgemedia.com";

export type ResolvedHubHost =
  | { kind: "platform" }
  | { kind: "client"; slug: string };

export function stripPort(host: string) {
  return host.replace(/:\d+$/, "").toLowerCase().trim();
}

export function isPlatformHubHost(hostname: string): boolean {
  const host = stripPort(hostname);
  if (!host) return true;
  if (host === HUB0_HOST) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".up.railway.app") || host.endsWith(".railway.internal")) return true;
  return false;
}

/** Host that might be a hub admin's vanity domain — never Hub 0. */
export function isCustomDomainCandidate(hostname: string): boolean {
  const host = stripPort(hostname);
  if (!host || isPlatformHubHost(host)) return false;
  if (host.endsWith(CLIENT_HUB_SUFFIX)) return false;
  return host.includes(".");
}

export function hostnameFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-host");
  const raw = (forwarded?.split(",")[0] || headers.get("host") || "").trim();
  return stripPort(raw);
}

/**
 * Browser-facing origin for this request. Auth.js pins `req.nextUrl` to
 * AUTH_URL (hub.triforgemedia.com), so never use that for client-hub redirects.
 */
export function publicOriginFromHeaders(headers: {
  get(name: string): string | null;
}): string | null {
  const host = hostnameFromHeaders(headers);
  if (!host) return null;
  const proto = (headers.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  return `${proto}://${host}`;
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

/** Public hostname members should use — custom domain when set. */
export function hubPublicHost(hub: { slug: string; customDomain?: string | null }) {
  const custom = hub.customDomain?.trim().toLowerCase();
  return custom || clientHubPublicHost(hub.slug);
}

export function hubPublicUrl(hub: { slug: string; customDomain?: string | null }) {
  return `https://${hubPublicHost(hub)}`;
}

/** Browser origin for Hub 0 (Forge Hub). Staging/local follow NEXT_PUBLIC_APP_URL. */
export function hub0PublicUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function hub0PublicHost() {
  try {
    return new URL(hub0PublicUrl()).host;
  } catch {
    return HUB0_HOST;
  }
}

import "server-only";

import {
  cloudflareDelegatedDnsRecords,
  type CustomDomainSetup,
} from "@/lib/hub/customDomain";

const CF_API = "https://api.cloudflare.com/client/v4";

type CfOwnership = { type?: string; name?: string; value?: string };
type CfValidationRecord = { txt_name?: string; txt_value?: string };
type CfSsl = {
  method?: string;
  status?: string;
  validation_records?: CfValidationRecord[];
};

const SSL_TXT = {
  method: "txt" as const,
  type: "dv" as const,
  settings: { min_tls_version: "1.2" },
};

type CfHostname = {
  id?: string;
  hostname?: string;
  status?: string;
  ssl?: CfSsl;
  ownership_verification?: CfOwnership;
};

type CfEnvelope<T> = {
  success?: boolean;
  errors?: Array<{ message?: string; code?: number }>;
  result?: T;
};

export function cloudflareCustomDomainReady() {
  return Boolean(cloudflareToken() && cloudflareZoneId());
}

export function cloudflareSaaSCnameTarget() {
  const raw = (process.env.CLOUDFLARE_CNAME_TARGET || "triforgemedia.com").trim().toLowerCase();
  return raw.replace(/^https?:\/\//, "").replace(/\.$/, "") || "triforgemedia.com";
}

export function cloudflareManualSetup(host: string): CustomDomainSetup {
  const cnameTarget = cloudflareSaaSCnameTarget();
  const dnsRecords = cloudflareDelegatedDnsRecords(host);
  return {
    host,
    provider: "cloudflare",
    railwayId: null,
    cloudflareId: null,
    cnameHost: host,
    cnameTarget,
    txtHost: null,
    txtValue: null,
    dnsRecords,
    issuedDnsRecords: dnsRecords,
    certificateStatus: null,
    dnsStatus: null,
  };
}

function cloudflareToken() {
  return (process.env.CLOUDFLARE_API_TOKEN || "").trim();
}

function cloudflareZoneId() {
  return (process.env.CLOUDFLARE_ZONE_ID || "").trim();
}

function cfError(errors: CfEnvelope<unknown>["errors"], status: number) {
  return errors?.[0]?.message || `Cloudflare API error (${status}).`;
}

async function cfFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = cloudflareToken();
  const zoneId = cloudflareZoneId();
  if (!token || !zoneId) {
    throw new Error("Cloudflare custom hostnames are not enabled on this server.");
  }
  const res = await fetch(`${CF_API}/zones/${zoneId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = (await res.json()) as CfEnvelope<T>;
  if (!res.ok || json.success === false) {
    throw new Error(cfError(json.errors, res.status));
  }
  if (init?.method === "DELETE") return undefined as T;
  if (json.result === undefined) throw new Error("Cloudflare API returned no data.");
  return json.result;
}

function setupFromCloudflare(host: string, row: CfHostname): CustomDomainSetup {
  const cnameTarget = cloudflareSaaSCnameTarget();
  const dnsRecords = cloudflareDelegatedDnsRecords(host);
  const sslStatus = row.ssl?.status || null;
  const hostStatus = row.status || null;

  return {
    host,
    provider: "cloudflare",
    railwayId: null,
    cloudflareId: typeof row.id === "string" ? row.id : null,
    cnameHost: host,
    cnameTarget,
    txtHost: null,
    txtValue: null,
    dnsRecords,
    issuedDnsRecords: dnsRecords,
    certificateStatus: sslStatus || hostStatus,
    dnsStatus: hostStatus,
  };
}

async function findCloudflareHostname(host: string): Promise<CfHostname | null> {
  const result = await cfFetch<CfHostname[] | CfHostname>(
    `/custom_hostnames?hostname=${encodeURIComponent(host)}`
  );
  if (Array.isArray(result)) {
    return result.find((row) => (row.hostname || "").toLowerCase() === host) || result[0] || null;
  }
  if (result && typeof result === "object" && result.hostname) return result;
  return null;
}

export async function attachCloudflareCustomHostname(host: string): Promise<CustomDomainSetup> {
  const existing = await findCloudflareHostname(host);
  if (existing?.id) return setupFromCloudflare(host, existing);

  try {
    const created = await cfFetch<CfHostname>("/custom_hostnames", {
      method: "POST",
      body: JSON.stringify({
        hostname: host,
        ssl: SSL_TXT,
      }),
    });
    return setupFromCloudflare(host, created);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/already|exist|duplicate|taken/i.test(message)) {
      const retry = await findCloudflareHostname(host);
      if (retry?.id) return setupFromCloudflare(host, retry);
    }
    throw err;
  }
}

export async function refreshCloudflareCustomHostname(
  host: string,
  cloudflareId?: string | null
): Promise<CustomDomainSetup> {
  try {
    if (cloudflareId) {
      const row = await cfFetch<CfHostname>(`/custom_hostnames/${encodeURIComponent(cloudflareId)}`);
      return setupFromCloudflare(host, row);
    }
  } catch {
    // Fall through and create/find by hostname.
  }
  try {
    return await attachCloudflareCustomHostname(host);
  } catch {
    // Token/zone miss or API error — still show the CNAME the registrar needs.
    const fallback = cloudflareManualSetup(host);
    return cloudflareId ? { ...fallback, cloudflareId } : fallback;
  }
}

export async function detachCloudflareCustomHostname(cloudflareId: string | null | undefined) {
  if (!cloudflareId || !cloudflareCustomDomainReady()) return;
  try {
    await cfFetch(`/custom_hostnames/${encodeURIComponent(cloudflareId)}`, { method: "DELETE" });
  } catch {
    // Already gone — hostname is still cleared in Postgres.
  }
}

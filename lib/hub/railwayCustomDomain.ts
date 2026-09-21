import "server-only";

import type { CustomDomainSetup } from "@/lib/hub/customDomain";

const RAILWAY_GQL = "https://backboard.railway.com/graphql/v2";

const DOMAIN_STATUS_FIELDS = `
  certificateStatus
  verified
  verificationDnsHost
  verificationToken
  dnsRecords {
    fqdn
    hostlabel
    purpose
    recordType
    requiredValue
    status
    zone
  }
`;

type RailwayDomainRow = {
  id: string;
  domain: string;
  status?: unknown;
};

export function railwayDomainApiReady(): boolean {
  return Boolean(
    railwayToken() &&
      process.env.RAILWAY_SERVICE_ID &&
      process.env.RAILWAY_ENVIRONMENT_ID &&
      process.env.RAILWAY_PROJECT_ID
  );
}

function railwayToken() {
  return process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN || "";
}

function serviceIds() {
  const serviceId = process.env.RAILWAY_SERVICE_ID || "";
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID || "";
  const projectId = process.env.RAILWAY_PROJECT_ID || "";
  if (!railwayToken() || !serviceId || !environmentId || !projectId) {
    throw new Error(
      "Custom-domain HTTPS is not enabled on this server. Add a Railway project token as RAILWAY_TOKEN (service, environment, and project ids are already on Railway)."
    );
  }
  return { serviceId, environmentId, projectId };
}

async function railwayGql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = railwayToken();
  const res = await fetch(RAILWAY_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Project-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!res.ok || (json.errors && json.errors.length > 0)) {
    throw new Error(json.errors?.[0]?.message || `Railway API error (${res.status}).`);
  }
  if (!json.data) throw new Error("Railway API returned no data.");
  return json.data;
}

function setupFromRailway(host: string, id: string, status: unknown): CustomDomainSetup {
  const blob = status && typeof status === "object" ? (status as Record<string, unknown>) : {};
  const records = Array.isArray(blob.dnsRecords) ? blob.dnsRecords : [];
  let cnameTarget: string | null = null;
  let dnsStatus: string | null = null;
  for (const raw of records) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const required = typeof rec.requiredValue === "string" ? rec.requiredValue.replace(/\.$/, "") : "";
    const purpose = String(rec.purpose || "").toUpperCase();
    const recordType = String(rec.recordType || "").toUpperCase();
    const isRoute =
      purpose.includes("TRAFFIC") ||
      recordType.includes("CNAME") ||
      required.includes("railway.app");
    if (required && isRoute) {
      cnameTarget = required;
      dnsStatus = typeof rec.status === "string" ? rec.status : dnsStatus;
    }
  }
  const txtHostRaw =
    typeof blob.verificationDnsHost === "string" ? blob.verificationDnsHost.replace(/\.$/, "") : null;
  const txtValue = typeof blob.verificationToken === "string" ? blob.verificationToken : null;
  let txtHost = txtHostRaw;
  if (txtHost && !txtHost.includes(".")) {
    txtHost = `${txtHost}.${host}`;
  } else if (txtHost && !txtHost.endsWith(host) && txtHost.startsWith("_")) {
    if (!txtHost.includes(host)) txtHost = txtHost.includes(".") ? `${txtHost}.${host.split(".").slice(-2).join(".")}` : `${txtHost}.${host}`;
  }

  const certificateStatus =
    typeof blob.certificateStatus === "string"
      ? blob.certificateStatus
      : blob.verified === true
        ? "ISSUED"
        : null;

  return {
    host,
    provider: "railway",
    railwayId: id,
    cnameHost: host,
    cnameTarget,
    txtHost,
    txtValue,
    certificateStatus,
    dnsStatus,
  };
}

async function listRailwayCustomDomains(): Promise<RailwayDomainRow[]> {
  const { projectId, environmentId, serviceId } = serviceIds();
  const data = await railwayGql<{
    domains: { customDomains?: RailwayDomainRow[] };
  }>(
    `query HubDomains($projectId: String!, $environmentId: String!, $serviceId: String!) {
      domains(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId) {
        customDomains {
          id
          domain
          status { ${DOMAIN_STATUS_FIELDS} }
        }
      }
    }`,
    { projectId, environmentId, serviceId }
  );
  return (data.domains?.customDomains || []).map((row) => ({
    ...row,
    domain: row.domain.toLowerCase(),
  }));
}

async function loadRailwayDomain(id: string): Promise<RailwayDomainRow> {
  const { projectId } = serviceIds();
  const data = await railwayGql<{ customDomain: RailwayDomainRow }>(
    `query HubCustomDomain($id: String!, $projectId: String!) {
      customDomain(id: $id, projectId: $projectId) {
        id
        domain
        status { ${DOMAIN_STATUS_FIELDS} }
      }
    }`,
    { id, projectId }
  );
  return data.customDomain;
}

export async function attachRailwayCustomDomain(host: string): Promise<CustomDomainSetup> {
  const existing = (await listRailwayCustomDomains()).find((row) => row.domain === host);
  if (existing) {
    return setupFromRailway(host, existing.id, existing.status);
  }

  const { serviceId, environmentId, projectId } = serviceIds();
  try {
    const data = await railwayGql<{
      customDomainCreate: { id: string; domain: string; status?: unknown };
    }>(
      `mutation HubCustomDomainCreate($input: CustomDomainCreateInput!) {
        customDomainCreate(input: $input) {
          id
          domain
          status { ${DOMAIN_STATUS_FIELDS} }
        }
      }`,
      { input: { serviceId, environmentId, projectId, domain: host } }
    );
    const created = data.customDomainCreate;
    return setupFromRailway(host, created.id, created.status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/already|exist|taken|conflict/i.test(message)) {
      const retry = (await listRailwayCustomDomains()).find((row) => row.domain === host);
      if (retry) return setupFromRailway(host, retry.id, retry.status);
    }
    throw err;
  }
}

export async function refreshRailwayCustomDomain(
  railwayId: string,
  host: string
): Promise<CustomDomainSetup> {
  const row = await loadRailwayDomain(railwayId);
  return setupFromRailway(host, row.id, row.status);
}

export async function detachRailwayCustomDomain(railwayId: string | null | undefined) {
  if (!railwayId || !railwayToken()) return;
  try {
    await railwayGql(
      `mutation HubCustomDomainDelete($id: String!) {
        customDomainDelete(id: $id)
      }`,
      { id: railwayId }
    );
  } catch {
    // Already gone, or token can’t delete — hostname is still cleared in Postgres.
  }
}

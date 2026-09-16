/** Postgres schema names we allow for client hubs: hub_{slug with underscores}. */
export const TENANT_SCHEMA_RE = /^hub_[a-z0-9_]+$/;

/** Conservative pool so many tenant clients cannot exhaust Railway Postgres. */
export const TENANT_CONNECTION_LIMIT = 2;

export function tenantSchemaName(slug: string) {
  const name = `hub_${slug.replace(/-/g, "_")}`;
  if (!TENANT_SCHEMA_RE.test(name)) {
    throw new Error("Invalid hub slug for a database schema.");
  }
  return name;
}

export function isTenantSchemaName(name: string) {
  return TENANT_SCHEMA_RE.test(name) && name !== "public";
}

export function withSchema(databaseUrl: string, schema: string) {
  const stripped = databaseUrl
    .replace(/([?&])schema=[^&]*/gi, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");
  const join = stripped.includes("?") ? "&" : "?";
  return `${stripped}${join}schema=${encodeURIComponent(schema)}`;
}

export function withTenantPoolLimits(databaseUrl: string) {
  let url = databaseUrl;
  if (!/[?&]connection_limit=/i.test(url)) {
    const join = url.includes("?") ? "&" : "?";
    url = `${url}${join}connection_limit=${TENANT_CONNECTION_LIMIT}`;
  }
  if (!/[?&]pool_timeout=/i.test(url)) {
    const join = url.includes("?") ? "&" : "?";
    url = `${url}${join}pool_timeout=10`;
  }
  return url;
}

export function tenantDatasourceUrl(databaseUrl: string, schema: string) {
  if (!isTenantSchemaName(schema)) {
    throw new Error("Refusing to open a non-tenant schema as a client hub database.");
  }
  return withTenantPoolLimits(withSchema(databaseUrl, schema));
}

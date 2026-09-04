import { ALL_SKU_IDS, CORE_SKUS, OPTIONAL_SKUS } from "@/lib/hub/catalog";

export const RESERVED_HUB_SLUGS = new Set([
  "www",
  "hub",
  "mail",
  "staging",
  "admin",
  "api",
  "app",
  "live",
  "shop",
  "status",
  "updates",
  "triforge",
  "triforgemedia",
  "root",
]);

export type SetupStepId = "dns" | "tls" | "database" | "invite";

export type HubSetupStep = {
  id: SetupStepId;
  field: "dnsCnameAt" | "railwayDomainAt" | "tenantDbAt" | "adminInvitedAt";
  label: string;
  how: string;
};

export const HUB_SETUP_STEPS: HubSetupStep[] = [
  {
    id: "dns",
    field: "dnsCnameAt",
    label: "DNS CNAME",
    how: "Wildcard DNS is already on `*.hub.triforgemedia.com`. Mark this when the slug hostname resolves.",
  },
  {
    id: "tls",
    field: "railwayDomainAt",
    label: "Railway TLS domain",
    how: "Wildcard Railway domain `*.hub.triforgemedia.com` should already have a green cert. Mark this when HTTPS loads for this slug.",
  },
  {
    id: "database",
    field: "tenantDbAt",
    label: "Tenant database",
    how: "Extra database on the existing Postgres (not a new Railway Postgres tile). Scripted next.",
  },
  {
    id: "invite",
    field: "adminInvitedAt",
    label: "Invite client admin",
    how: "Send a hub invite to the client admin email. Sending is not wired yet — check this when you’ve invited them.",
  },
];

export function normalizeHubSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseHubSkuIds(values: FormDataEntryValue[]) {
  const optionalIds = new Set(OPTIONAL_SKUS.map((sku) => sku.id));
  const enabled = new Set<string>(CORE_SKUS.map((sku) => sku.id));
  for (const value of values) {
    if (typeof value === "string" && optionalIds.has(value)) {
      enabled.add(value);
    }
  }
  return ALL_SKU_IDS.filter((id) => enabled.has(id));
}

/** New client hubs start with core only — optional modules stay off until checked. */
export function defaultClientSkuIds() {
  return CORE_SKUS.map((sku) => sku.id);
}

export function validateHubInput(
  input: { name: string; slug: string; email: string }
): { ok: false; error: string } | { ok: true; name: string; slug: string; email: string } {
  const name = input.name.trim();
  const slug = normalizeHubSlug(input.slug);
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) return { ok: false, error: "Hub name needs at least 2 characters." };
  if (slug.length < 2) return { ok: false, error: "Slug needs at least 2 letters." };
  if (RESERVED_HUB_SLUGS.has(slug)) return { ok: false, error: `"${slug}" is reserved.` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid client admin email." };
  }

  return { ok: true, name, slug, email };
}

export function nextSetupStep(hub: {
  dnsCnameAt: Date | null;
  railwayDomainAt: Date | null;
  tenantDbAt: Date | null;
  adminInvitedAt: Date | null;
}) {
  return HUB_SETUP_STEPS.find((step) => !hub[step.field]) ?? null;
}

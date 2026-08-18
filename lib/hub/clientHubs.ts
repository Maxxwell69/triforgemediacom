import { ALL_SKU_IDS, CORE_SKUS, OPTIONAL_SKUS, isHubSkuId } from "@/lib/hub/catalog";

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
    how: "Add CNAME `{slug}.hub` → the same Railway hostname as hub.triforgemedia.com (DNS only, not proxied).",
  },
  {
    id: "tls",
    field: "railwayDomainAt",
    label: "Railway TLS domain",
    how: "Railway → triforgemediacom → custom domains → add `{slug}.hub.triforgemedia.com` so TLS issues.",
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
  const enabled = new Set<string>(CORE_SKUS.map((sku) => sku.id));
  for (const value of values) {
    if (typeof value === "string" && isHubSkuId(value) && value !== "core") {
      enabled.add(value);
    }
  }
  return ALL_SKU_IDS.filter((id) => enabled.has(id));
}

export function defaultClientSkuIds() {
  return ["core", ...OPTIONAL_SKUS.map((sku) => sku.id)];
}

export function validateHubInput(input: { name: string; slug: string; email: string }) {
  const name = input.name.trim();
  const slug = normalizeHubSlug(input.slug);
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) return { error: "Hub name needs at least 2 characters." };
  if (slug.length < 2) return { error: "Slug needs at least 2 letters." };
  if (RESERVED_HUB_SLUGS.has(slug)) return { error: `“${slug}” is reserved.` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid client admin email." };

  return { name, slug, email };
}

export function nextSetupStep(hub: {
  dnsCnameAt: Date | null;
  railwayDomainAt: Date | null;
  tenantDbAt: Date | null;
  adminInvitedAt: Date | null;
}) {
  return HUB_SETUP_STEPS.find((step) => !hub[step.field]) ?? null;
}

import "server-only";

import { Resend } from "resend";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { hubHas } from "@/lib/hub/modules";
import { clientHubPublicUrl } from "@/lib/hub/directory";
import { readClientHubCustomDomain } from "@/lib/hub/customDomain";
import { appOrigin } from "@/lib/emailLayout";
import { decryptSecret, encryptSecret } from "@/lib/secretBox";

const FROM_RE = /^.+\s<[^@\s]+@[^@\s]+\.[^@\s]+>$|^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type OutreachMailer =
  | { mode: "platform"; resend: Resend | null; from: string; hubName: string; hubOrigin: string }
  | { mode: "hub"; resend: Resend; from: string; hubName: string; hubOrigin: string }
  | { mode: "missing"; resend: null; from: null; hubName: string; hubOrigin: string };

function platformFrom() {
  return process.env.RESEND_FROM_EMAIL || "TriForge <noreply@triforgemedia.com>";
}

function platformResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? new Resend(key) : null;
}

export function parseResendFrom(raw: string) {
  const value = raw.trim().slice(0, 200);
  if (!value || !FROM_RE.test(value)) return null;
  return value;
}

type HubResendRow = {
  resendApiKeyEnc: string | null;
  resendFromEmail: string | null;
  resendDomainReady: boolean;
};

async function loadHubResendRow(hubId: string): Promise<HubResendRow | null> {
  const { getControlPrisma } = await import("@/lib/hub/tenantPrisma");
  const rows = await getControlPrisma().$queryRawUnsafe<HubResendRow[]>(
    `SELECT "resendApiKeyEnc", "resendFromEmail", "resendDomainReady"
     FROM "ClientHub" WHERE id = $1 LIMIT 1`,
    hubId
  );
  return rows[0] ?? null;
}

export async function getClientHubResendStatus(hubId: string) {
  const row = await loadHubResendRow(hubId);
  return {
    hasKey: Boolean(row?.resendApiKeyEnc),
    fromEmail: row?.resendFromEmail || "",
    domainReady: Boolean(row?.resendDomainReady),
  };
}

export async function saveClientHubResendSettings(opts: {
  hubId: string;
  apiKey?: string;
  fromEmail: string;
  domainReady: boolean;
  clearKey?: boolean;
}) {
  const from = parseResendFrom(opts.fromEmail);
  if (!from) {
    throw new Error("From address must look like Name <you@yourdomain.com> or you@yourdomain.com.");
  }

  const { getControlPrisma } = await import("@/lib/hub/tenantPrisma");
  const control = getControlPrisma();
  const current = await loadHubResendRow(opts.hubId);
  let enc = current?.resendApiKeyEnc ?? null;
  if (opts.clearKey) enc = null;
  const incoming = opts.apiKey?.trim();
  if (incoming) {
    if (!incoming.startsWith("re_")) {
      throw new Error("Resend API keys start with re_.");
    }
    enc = encryptSecret(incoming);
  }

  await control.$executeRawUnsafe(
    `UPDATE "ClientHub"
     SET "resendApiKeyEnc" = $1,
         "resendFromEmail" = $2,
         "resendDomainReady" = $3,
         "updatedAt" = NOW()
     WHERE id = $4`,
    enc,
    from,
    opts.domainReady,
    opts.hubId
  );
}

export async function currentHubPublicOrigin() {
  const ctx = await getRequestHubContext();
  if (ctx.kind === "client" || ctx.kind === "client-unprovisioned") {
    const custom = await readClientHubCustomDomain(ctx.control, ctx.hub.id);
    return clientHubPublicUrl(ctx.hub.slug, custom);
  }
  return appOrigin();
}

export async function currentHubDisplayName() {
  const ctx = await getRequestHubContext();
  if (ctx.kind === "client" || ctx.kind === "client-unprovisioned") {
    return ctx.hub.name;
  }
  return "TriForge Hub";
}

/** Mailer for Conversations outreach and (on client hubs with the SKU) broadcasts. */
export async function resolveOutreachMailer(): Promise<OutreachMailer> {
  const ctx = await getRequestHubContext();
  const hubOrigin = await currentHubPublicOrigin();
  const conversationsOn = hubHas("conversations");

  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    return {
      mode: "platform",
      resend: platformResend(),
      from: platformFrom(),
      hubName: "TriForge Hub",
      hubOrigin,
    };
  }

  const hubName = ctx.hub.name;
  if (!conversationsOn) {
    return {
      mode: "platform",
      resend: platformResend(),
      from: platformFrom(),
      hubName,
      hubOrigin,
    };
  }

  const row = await loadHubResendRow(ctx.hub.id);
  const enc = row?.resendApiKeyEnc?.trim() || "";
  const from = row?.resendFromEmail?.trim() || "";
  if (!enc || !from) {
    return { mode: "missing", resend: null, from: null, hubName, hubOrigin };
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(enc);
  } catch (err) {
    console.error("hub Resend key decrypt failed", ctx.hub.slug, err);
    return { mode: "missing", resend: null, from: null, hubName, hubOrigin };
  }

  return {
    mode: "hub",
    resend: new Resend(apiKey),
    from,
    hubName,
    hubOrigin,
  };
}

export function outreachMailerRequiredError() {
  return "Add this hub’s Resend key under Conversations → Sending before sending outreach or broadcasts.";
}

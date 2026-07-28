/**
 * Minimal read-only client for GoHighLevel's API v2 (LeadConnector), used to
 * pull contacts by tag for the one-time Hub migration importer
 * (/admin/import). Deliberately narrow in scope — only what's needed to
 * search contacts — since the Courses/Memberships side of GHL's API is
 * undocumented/unreliable and is handled as a manual content migration
 * instead (see DEPLOYMENT.md).
 */

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const PAGE_LIMIT = 100;
const MAX_PAGES = 20; // safety cap — 2,000 contacts is far more than we'd ever expect here

export type GhlContactSummary = {
  ghlContactId: string;
  name: string | null;
  email: string;
  phone: string | null;
  tags: string[];
};

function requireGhlConfig() {
  const token = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error(
      "GoHighLevel isn't configured yet — set GHL_API_KEY and GHL_LOCATION_ID."
    );
  }
  return { token, locationId };
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

type GhlApiContact = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  tags?: string[] | null;
};

/**
 * Searches GHL contacts tagged with the given tag (exact match, case as
 * stored in GHL). Paginates through all results. Skips any contact without
 * an email — there's nothing to invite them with.
 */
export async function searchGhlContactsByTag(tag: string): Promise<GhlContactSummary[]> {
  const { token, locationId } = requireGhlConfig();

  const results: GhlContactSummary[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const res = await fetch(`${GHL_API_BASE}/contacts/search`, {
      method: "POST",
      headers: ghlHeaders(token),
      body: JSON.stringify({
        locationId,
        page,
        pageLimit: PAGE_LIMIT,
        filters: [{ field: "tags", operator: "in", value: [tag] }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `GoHighLevel contacts search failed (${res.status}): ${body.slice(0, 300) || res.statusText}`
      );
    }

    const data = (await res.json()) as { contacts?: GhlApiContact[] };
    const contacts = Array.isArray(data.contacts) ? data.contacts : [];

    for (const c of contacts) {
      if (!c.email) continue;
      const name =
        [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.contactName || null;
      results.push({
        ghlContactId: c.id,
        name,
        email: c.email,
        phone: c.phone || null,
        tags: Array.isArray(c.tags) ? c.tags : [],
      });
    }

    if (contacts.length < PAGE_LIMIT) break;
    page++;
  }

  return results;
}

export function isGhlConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

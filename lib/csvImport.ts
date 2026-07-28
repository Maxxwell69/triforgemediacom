/**
 * Tiny CSV parser for the one-time contact import (/admin/import). Handles
 * quoted fields (including embedded commas/escaped quotes) without pulling
 * in a dependency for what's a ~30-row, admin-only, occasional-use tool.
 *
 * Expected format: a header row containing at least an "email" column, plus
 * optional "name", "phone", and "tags" columns (tags separated by `;` or `|`
 * within their cell, e.g. "creator-network;no-agency"). Column order doesn't
 * matter as long as the header names match.
 */

export type CsvContactRow = {
  name: string | null;
  email: string;
  phone: string | null;
  tags: string[];
};

export type CsvParseOutcome = {
  rows: CsvContactRow[];
  errors: string[];
};

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

export function parseContactsCsv(raw: string): CsvParseOutcome {
  const errors: string[] = [];
  const lines = raw
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["The file/paste is empty."] };
  }

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) {
    return {
      rows: [],
      errors: [
        'First row must be a header row with an "email" column, e.g.: name,email,phone,tags',
      ],
    };
  }
  const nameIdx = header.indexOf("name");
  const phoneIdx = header.indexOf("phone");
  const tagsIdx = header.indexOf("tags");

  const rows: CsvContactRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const email = cells[emailIdx]?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      errors.push(`Row ${i + 1}: missing or invalid email, skipped.`);
      continue;
    }
    if (seen.has(email)) {
      errors.push(`Row ${i + 1}: duplicate email in file (${email}), skipped.`);
      continue;
    }
    seen.add(email);

    const name = nameIdx >= 0 ? cells[nameIdx]?.trim() || null : null;
    const phone = phoneIdx >= 0 ? cells[phoneIdx]?.trim() || null : null;
    const tagsRaw = tagsIdx >= 0 ? cells[tagsIdx]?.trim() || "" : "";
    const tags = tagsRaw
      ? tagsRaw
          .split(/[;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    rows.push({ name, email, phone, tags });
  }

  return { rows, errors };
}

/**
 * GHL's own application form tags contacts "no agency" / "yes agency" based
 * on their answer to the agency question — mirrors the same MN/CN routing
 * used on our own /apply form (see lib/mnCn.ts). Anyone missing both tags
 * defaults to MN (has agency) per admin instruction, since that's the more
 * common case for this batch and doesn't trigger the CN/TikTok flow.
 */
export function deriveHasAgencyFromTags(tags: string[]): boolean {
  const normalized = tags.map((t) => t.toLowerCase().trim());
  if (normalized.includes("no agency")) return false;
  if (normalized.includes("yes agency")) return true;
  return true;
}

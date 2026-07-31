/**
 * One-off runner that mirrors app/admin/import/actions.ts#importCsvContacts
 * exactly (same models, same MN/CN routing, same de-dupe rules) but runs
 * outside of an authenticated Next.js request — for when an admin hands over
 * a CSV directly instead of using the /admin/import UI. Always runs with
 * sendEmail: false; use the "Send pending invites" button in /admin/import
 * (or scripts/sendGhlInvites.ts) when you're ready to actually notify them.
 *
 * Usage: tsx scripts/runGhlImport.ts <path-to-csv>
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { prisma } from "../lib/prisma";
import { parseContactsCsv, deriveHasAgencyFromTags } from "../lib/csvImport";
import { generateInviteToken, inviteTokenExpiry } from "../lib/invite";
import { syncNetworkMembership } from "../lib/mnCn";

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: tsx scripts/runGhlImport.ts <path-to-csv>");
    process.exit(1);
  }

  const csvText = readFileSync(csvPath, "utf-8");
  const { rows, errors: parseErrors } = parseContactsCsv(csvText);
  if (parseErrors.length > 0) {
    console.log("Parse warnings:");
    parseErrors.forEach((e) => console.log(`  - ${e}`));
  }

  let imported = 0;
  let skipped = 0;
  let mnCount = 0;
  let cnCount = 0;
  const results: { email: string; name: string | null; track: "MN" | "CN"; outcome: string }[] = [];

  for (const row of rows) {
    const importKey = `csv:${row.email}`;
    const [existingImport, existingUser] = await Promise.all([
      prisma.ghlImport.findUnique({ where: { ghlContactId: importKey } }),
      prisma.user.findUnique({ where: { email: row.email } }),
    ]);

    const hasAgency = deriveHasAgencyFromTags(row.tags);
    const track: "MN" | "CN" = hasAgency ? "MN" : "CN";

    if (existingImport || existingUser) {
      skipped++;
      results.push({ email: row.email, name: row.name, track, outcome: "SKIPPED (already exists)" });
      continue;
    }

    const token = generateInviteToken();
    const user = await prisma.user.create({
      data: {
        email: row.email,
        name: row.name,
        status: "INVITED",
        application: {
          create: {
            answers: {
              importedFromGhl: true,
              importSource: "csv",
              phone: row.phone,
              tags: row.tags,
              hasAgency: hasAgency ? "yes" : "no",
              track,
            },
            status: "APPROVED",
            inviteToken: token,
            inviteTokenExpiresAt: inviteTokenExpiry(),
            reviewedAt: new Date(),
          },
        },
        ghlImport: {
          create: {
            ghlContactId: importKey,
            name: row.name,
            email: row.email,
            phone: row.phone,
            tagsRaw: row.tags.join(", "),
            status: "INVITED",
            invitedAt: null, // not emailed yet — send later via "Send pending invites"
          },
        },
      },
    });

    await syncNetworkMembership(user.id, track);
    if (hasAgency) mnCount++;
    else cnCount++;

    imported++;
    results.push({ email: row.email, name: row.name, track, outcome: "IMPORTED (no email sent)" });
  }

  console.log("\n--- Results ---");
  for (const r of results) {
    console.log(`${r.outcome.padEnd(28)} ${r.track.padEnd(3)} ${r.name?.padEnd(24) ?? ""} ${r.email}`);
  }
  console.log(`\nImported: ${imported} (${mnCount} MN, ${cnCount} CN). Skipped: ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

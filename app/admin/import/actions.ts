"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { parseContactsCsv, deriveHasAgencyFromTags, type CsvContactRow } from "@/lib/csvImport";
import { generateInviteToken, inviteTokenExpiry, inviteUrl } from "@/lib/invite";
import { sendHubMigrationInviteEmail } from "@/lib/email";
import { syncMnMembership } from "@/lib/mnCn";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

export type CsvPreviewContact = CsvContactRow & {
  importKey: string;
  alreadyImported: boolean;
  existingUser: boolean;
  track: "MN" | "CN";
};

export type CsvParseResult = { errors: string[]; contacts: CsvPreviewContact[] };

/**
 * There's no real external contact ID once the source is a manually
 * exported CSV, but GhlImport.ghlContactId still needs something stable +
 * unique to key off of (for de-duping re-imports of the same file). The
 * email address itself is stable enough for that here.
 */
function importKeyFor(email: string): string {
  return `csv:${email}`;
}

export async function parseCsvPreview(csvText: string): Promise<CsvParseResult> {
  await requireAdmin();

  const { rows, errors } = parseContactsCsv(csvText);
  if (rows.length === 0) {
    return { errors, contacts: [] };
  }

  const emails = rows.map((r) => r.email);
  const [existingImports, existingUsers] = await Promise.all([
    prisma.ghlImport.findMany({ where: { email: { in: emails } }, select: { email: true } }),
    prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true } }),
  ]);
  const importedEmails = new Set(existingImports.map((i) => i.email));
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const contacts: CsvPreviewContact[] = rows.map((row) => ({
    ...row,
    importKey: importKeyFor(row.email),
    alreadyImported: importedEmails.has(row.email),
    existingUser: existingEmails.has(row.email),
    track: deriveHasAgencyFromTags(row.tags) ? "MN" : "CN",
  }));

  return { errors, contacts };
}

export async function importCsvContacts(
  contacts: CsvContactRow[],
  options?: { sendEmail?: boolean }
): Promise<{ imported: number; skipped: number; errors: string[]; mnCount: number; cnCount: number }> {
  await requireAdmin();
  const sendEmail = options?.sendEmail ?? true;

  let imported = 0;
  let skipped = 0;
  let mnCount = 0;
  let cnCount = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    try {
      const key = importKeyFor(contact.email);
      const [existingImport, existingUser] = await Promise.all([
        prisma.ghlImport.findUnique({ where: { ghlContactId: key } }),
        prisma.user.findUnique({ where: { email: contact.email } }),
      ]);
      if (existingImport || existingUser) {
        skipped++;
        continue;
      }

      const hasAgency = deriveHasAgencyFromTags(contact.tags);
      const token = generateInviteToken();

      const user = await prisma.user.create({
        data: {
          email: contact.email,
          name: contact.name,
          status: "INVITED",
          application: {
            create: {
              answers: {
                importedFromGhl: true,
                importSource: "csv",
                phone: contact.phone,
                tags: contact.tags,
                hasAgency: hasAgency ? "yes" : "no",
              },
              status: "APPROVED",
              inviteToken: token,
              inviteTokenExpiresAt: inviteTokenExpiry(),
              reviewedAt: new Date(),
            },
          },
          ghlImport: {
            create: {
              ghlContactId: key,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              tagsRaw: contact.tags.join(", "),
              status: "INVITED",
              // Left null when sendEmail is false — that's the signal (used
              // by the "Send pending invites" bulk action) that this person
              // hasn't actually been emailed yet, just created.
              invitedAt: sendEmail ? new Date() : null,
            },
          },
        },
      });

      // Routes them into the MN group/tag (or leaves them out for CN) the
      // same way the normal /apply form does, so downstream admin views and
      // any MN-gated content behave identically for imported accounts.
      await syncMnMembership(user.id, hasAgency);
      if (hasAgency) mnCount++;
      else cnCount++;

      if (sendEmail) {
        try {
          await sendHubMigrationInviteEmail(contact.email, contact.name || "there", inviteUrl(token));
        } catch (err) {
          errors.push(
            `${contact.email}: account created but the invite email failed to send (${
              err instanceof Error ? err.message : "unknown error"
            })`
          );
        }
      }

      imported++;
    } catch (err) {
      errors.push(`${contact.email}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  revalidatePath("/admin/import");
  revalidatePath("/admin/users");
  return { imported, skipped, errors, mnCount, cnCount };
}

export async function resendGhlInvite(ghlImportId: string) {
  await requireAdmin();

  const record = await prisma.ghlImport.findUnique({
    where: { id: ghlImportId },
    include: { user: { include: { application: true } } },
  });
  if (!record || !record.user) throw new Error("Import record not found");
  if (record.user.status !== "INVITED") throw new Error("This person isn't in an invited state");

  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();

  if (record.user.application) {
    await prisma.application.update({
      where: { id: record.user.application.id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });
  } else {
    await prisma.application.create({
      data: {
        userId: record.user.id,
        answers: { importedFromGhl: true, importSource: "csv" },
        status: "APPROVED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
        reviewedAt: new Date(),
      },
    });
  }

  await prisma.ghlImport.update({ where: { id: ghlImportId }, data: { invitedAt: new Date() } });
  await sendHubMigrationInviteEmail(record.user.email, record.user.name || "there", inviteUrl(token));

  revalidatePath("/admin/import");
}

/**
 * For imports done with sendEmail: false (e.g. staging dry-runs, or holding
 * off until go-live) — sends the migration invite to everyone still
 * un-emailed in one pass, generating a fresh token/expiry for each so it
 * doesn't matter how long ago they were actually imported.
 */
export async function sendPendingGhlInvites(): Promise<{ sent: number; errors: string[] }> {
  await requireAdmin();

  const pending = await prisma.ghlImport.findMany({
    where: { status: "INVITED", invitedAt: null },
    include: { user: { include: { application: true } } },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const record of pending) {
    if (!record.user || record.user.status !== "INVITED") continue;
    try {
      const token = generateInviteToken();
      const expiresAt = inviteTokenExpiry();

      if (record.user.application) {
        await prisma.application.update({
          where: { id: record.user.application.id },
          data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
        });
      } else {
        await prisma.application.create({
          data: {
            userId: record.user.id,
            answers: { importedFromGhl: true, importSource: "csv" },
            status: "APPROVED",
            inviteToken: token,
            inviteTokenExpiresAt: expiresAt,
            reviewedAt: new Date(),
          },
        });
      }

      await prisma.ghlImport.update({ where: { id: record.id }, data: { invitedAt: new Date() } });
      await sendHubMigrationInviteEmail(record.user.email, record.user.name || "there", inviteUrl(token));
      sent++;
    } catch (err) {
      errors.push(`${record.email}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  revalidatePath("/admin/import");
  return { sent, errors };
}

export async function markGhlImportStatus(ghlImportId: string, status: "CONFIRMED" | "DECLINED") {
  await requireAdmin();
  await prisma.ghlImport.update({
    where: { id: ghlImportId },
    data: { status, respondedAt: new Date() },
  });
  revalidatePath("/admin/import");
}

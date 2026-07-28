"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { searchGhlContactsByTag, type GhlContactSummary } from "@/lib/ghl";
import { generateInviteToken, inviteTokenExpiry, inviteUrl } from "@/lib/invite";
import { sendHubMigrationInviteEmail } from "@/lib/email";

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

export type GhlPreviewContact = GhlContactSummary & {
  alreadyImported: boolean;
  existingUser: boolean;
};

export type GhlFetchResult = { error?: string; contacts: GhlPreviewContact[] };

export async function fetchGhlContactsByTag(tag: string): Promise<GhlFetchResult> {
  await requireAdmin();

  const trimmed = tag.trim();
  if (!trimmed) {
    return { error: "Enter a tag name to search for.", contacts: [] };
  }

  let contacts: GhlContactSummary[];
  try {
    contacts = await searchGhlContactsByTag(trimmed);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to reach GoHighLevel.",
      contacts: [],
    };
  }

  if (contacts.length === 0) {
    return { contacts: [] };
  }

  const [existingImports, existingUsers] = await Promise.all([
    prisma.ghlImport.findMany({
      where: { ghlContactId: { in: contacts.map((c) => c.ghlContactId) } },
      select: { ghlContactId: true },
    }),
    prisma.user.findMany({
      where: { email: { in: contacts.map((c) => c.email) } },
      select: { email: true },
    }),
  ]);
  const importedIds = new Set(existingImports.map((i) => i.ghlContactId));
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  return {
    contacts: contacts.map((c) => ({
      ...c,
      alreadyImported: importedIds.has(c.ghlContactId),
      existingUser: existingEmails.has(c.email),
    })),
  };
}

export async function importGhlContacts(
  contacts: GhlContactSummary[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  await requireAdmin();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    try {
      const [existingImport, existingUser] = await Promise.all([
        prisma.ghlImport.findUnique({ where: { ghlContactId: contact.ghlContactId } }),
        prisma.user.findUnique({ where: { email: contact.email } }),
      ]);
      if (existingImport || existingUser) {
        skipped++;
        continue;
      }

      const token = generateInviteToken();

      await prisma.user.create({
        data: {
          email: contact.email,
          name: contact.name,
          status: "INVITED",
          application: {
            create: {
              answers: {
                importedFromGhl: true,
                ghlContactId: contact.ghlContactId,
                phone: contact.phone,
                tags: contact.tags,
              },
              status: "APPROVED",
              inviteToken: token,
              inviteTokenExpiresAt: inviteTokenExpiry(),
              reviewedAt: new Date(),
            },
          },
          ghlImport: {
            create: {
              ghlContactId: contact.ghlContactId,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              tagsRaw: contact.tags.join(", "),
              status: "INVITED",
              invitedAt: new Date(),
            },
          },
        },
      });

      try {
        await sendHubMigrationInviteEmail(contact.email, contact.name || "there", inviteUrl(token));
      } catch (err) {
        errors.push(
          `${contact.email}: account created but the invite email failed to send (${
            err instanceof Error ? err.message : "unknown error"
          })`
        );
      }

      imported++;
    } catch (err) {
      errors.push(`${contact.email}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  revalidatePath("/admin/import");
  revalidatePath("/admin/users");
  return { imported, skipped, errors };
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
        answers: { importedFromGhl: true, ghlContactId: record.ghlContactId },
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

export async function markGhlImportStatus(ghlImportId: string, status: "CONFIRMED" | "DECLINED") {
  await requireAdmin();
  await prisma.ghlImport.update({
    where: { id: ghlImportId },
    data: { status, respondedAt: new Date() },
  });
  revalidatePath("/admin/import");
}

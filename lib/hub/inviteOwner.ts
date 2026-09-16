import "server-only";

import { sendClientHubInviteEmail } from "@/lib/email";
import { clientHubInviteUrl, generateInviteToken, inviteTokenExpiry } from "@/lib/invite";
import { getControlPrisma, getTenantPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";

export async function inviteClientHubOwner(hubId: string): Promise<{ error: string | null }> {
  const control = getControlPrisma();
  const hub = await control.clientHub.findUnique({ where: { id: hubId } });
  if (!hub) return { error: "Hub not found." };
  if (!hub.tenantDbName || !hub.tenantDbAt) {
    return { error: "Provision the hub database before inviting the owner." };
  }

  const ping = await pingTenantSchema(hub.tenantDbName);
  if (!ping.ok) {
    return { error: ping.error };
  }

  const db = getTenantPrisma(hub.tenantDbName);
  const email = hub.clientAdminEmail.toLowerCase();
  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();

  const existing = await db.user.findUnique({
    where: { email },
    include: { application: true },
  });

  if (existing?.status === "ACTIVE" && existing.passwordHash) {
    return { error: "That owner already set up their account. They can sign in on this hub." };
  }

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", status: "INVITED", name: existing.name || hub.name },
    });
    if (existing.application) {
      await db.application.update({
        where: { id: existing.application.id },
        data: {
          status: "APPROVED",
          inviteToken: token,
          inviteTokenExpiresAt: expiresAt,
          reviewedAt: new Date(),
        },
      });
    } else {
      await db.application.create({
        data: {
          userId: existing.id,
          answers: { name: hub.name, clientHubOwner: true, hubSlug: hub.slug },
          status: "APPROVED",
          inviteToken: token,
          inviteTokenExpiresAt: expiresAt,
          reviewedAt: new Date(),
        },
      });
    }
  } else {
    await db.user.create({
      data: {
        email,
        name: hub.name,
        role: "ADMIN",
        status: "INVITED",
        application: {
          create: {
            answers: { name: hub.name, clientHubOwner: true, hubSlug: hub.slug },
            status: "APPROVED",
            inviteToken: token,
            inviteTokenExpiresAt: expiresAt,
            reviewedAt: new Date(),
          },
        },
      },
    });
  }

  const url = clientHubInviteUrl(hub.slug, token);
  try {
    await sendClientHubInviteEmail(email, hub.name, url);
  } catch (err) {
    console.error("client hub owner invite email failed", hub.slug, err);
    return {
      error: `Owner was saved in the hub database, but the email failed (${
        err instanceof Error ? err.message : "unknown error"
      }). Check RESEND, then invite again.`,
    };
  }

  await control.clientHub.update({
    where: { id: hub.id },
    data: { adminInvitedAt: new Date() },
  });

  return { error: null };
}

import "server-only";

import { sendClientHubInviteEmail } from "@/lib/email";
import { clientHubInviteUrl, generateInviteToken, inviteTokenExpiry } from "@/lib/invite";
import { getControlPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";

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

  const email = hub.clientAdminEmail.toLowerCase();
  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();

  let user = await control.user.findUnique({
    where: { email },
    include: { hubMemberships: { where: { clientHubId: hub.id } } },
  });

  const existingMembership = user?.hubMemberships[0];
  if (existingMembership?.status === "ACTIVE") {
    return { error: "That owner already joined this hub. They can sign in with their existing login." };
  }

  if (!user) {
    user = await control.user.create({
      data: {
        email,
        name: hub.name,
        role: "MEMBER",
        status: "INVITED",
        platformAccess: false,
      },
      include: { hubMemberships: { where: { clientHubId: hub.id } } },
    });
  }

  if (existingMembership) {
    await control.hubMembership.update({
      where: { id: existingMembership.id },
      data: {
        role: "ADMIN",
        status: "INVITED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
      },
    });
  } else {
    await control.hubMembership.create({
      data: {
        userId: user.id,
        clientHubId: hub.id,
        role: "ADMIN",
        status: "INVITED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
      },
    });
  }

  const url = clientHubInviteUrl(hub.slug, token);
  try {
    await sendClientHubInviteEmail(email, hub.name, url);
  } catch (err) {
    console.error("client hub owner invite email failed", hub.slug, err);
    return {
      error: `Membership was saved, but the email failed (${
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

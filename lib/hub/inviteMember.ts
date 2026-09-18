import "server-only";

import { sendClientHubMemberInviteEmail } from "@/lib/email";
import { emailChromeFromKit } from "@/lib/hub/brandKit";
import { readClientHubBrandKit } from "@/lib/hub/brandKitStore";
import {
  clientHubInviteUrl,
  clientHubSignInUrl,
  generateInviteToken,
  inviteTokenExpiry,
} from "@/lib/invite";
import { ensureTenantMember } from "@/lib/hub/ensureTenantMember";
import { getControlPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";

export async function inviteClientHubMember(opts: {
  name: string;
  email: string;
  clientHubId: string;
  tenantDbName: string;
}): Promise<{ error: string | null }> {
  const ping = await pingTenantSchema(opts.tenantDbName);
  if (!ping.ok) {
    return { error: ping.error };
  }

  const control = getControlPrisma();
  const hub = await control.clientHub.findUnique({
    where: { id: opts.clientHubId },
    select: { id: true, name: true, slug: true },
  });
  if (!hub) return { error: "Hub not found." };

  const email = opts.email.toLowerCase();
  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();

  let user = await control.user.findUnique({
    where: { email },
    include: { hubMemberships: { where: { clientHubId: hub.id } } },
  });

  const existing = user?.hubMemberships[0];
  if (existing?.status === "BANNED") {
    return { error: "That email is banned on this hub." };
  }
  if (existing?.status === "ACTIVE") {
    return { error: "That person is already a member of this hub." };
  }

  if (!user) {
    user = await control.user.create({
      data: {
        email,
        name: opts.name,
        role: "MEMBER",
        status: "INVITED",
        platformAccess: false,
      },
      include: { hubMemberships: { where: { clientHubId: hub.id } } },
    });
  } else if (!user.name && opts.name) {
    user = await control.user.update({
      where: { id: user.id },
      data: { name: opts.name },
      include: { hubMemberships: { where: { clientHubId: hub.id } } },
    });
  }

  if (existing) {
    await control.hubMembership.update({
      where: { id: existing.id },
      data: {
        role: existing.role === "ADMIN" || existing.role === "MOD" ? existing.role : "MEMBER",
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
        role: "MEMBER",
        status: "INVITED",
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
      },
    });
  }

  const tenantUserId = await ensureTenantMember({
    tenantDbName: opts.tenantDbName,
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
    role: "MEMBER",
    status: "INVITED",
  });
  if (tenantUserId !== user.id) {
    await control.hubMembership.update({
      where: { userId_clientHubId: { userId: user.id, clientHubId: hub.id } },
      data: { tenantUserId },
    });
  }

  const hasPassword = !!user.passwordHash;
  const url = hasPassword ? clientHubSignInUrl(hub.slug) : clientHubInviteUrl(hub.slug, token);
  try {
    await sendClientHubMemberInviteEmail(
      email,
      hub.name,
      url,
      hasPassword,
      emailChromeFromKit(await readClientHubBrandKit(control, hub.id), hub.name)
    );
  } catch (err) {
    console.error("client hub member invite email failed", hub.slug, err);
    return {
      error: `They were added to this hub, but the email failed (${
        err instanceof Error ? err.message : "unknown error"
      }). Resend from Users.`,
    };
  }

  return { error: null };
}

export async function resendClientHubMemberInvite(opts: {
  userId: string;
  clientHubId: string;
}): Promise<{ error: string | null }> {
  const control = getControlPrisma();
  const membership = await control.hubMembership.findUnique({
    where: { userId_clientHubId: { userId: opts.userId, clientHubId: opts.clientHubId } },
    include: {
      user: { select: { email: true, name: true, passwordHash: true, status: true } },
      clientHub: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!membership) return { error: "They don't have an invite on this hub." };
  if (membership.status === "BANNED") return { error: "That account is banned on this hub." };

  const token = generateInviteToken();
  const expiresAt = inviteTokenExpiry();
  if (membership.status !== "ACTIVE") {
    await control.hubMembership.update({
      where: { id: membership.id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt, status: "INVITED" },
    });
  }

  const hasPassword = !!membership.user.passwordHash;
  const url = hasPassword
    ? clientHubSignInUrl(membership.clientHub.slug)
    : clientHubInviteUrl(membership.clientHub.slug, token);
  try {
    await sendClientHubMemberInviteEmail(
      membership.user.email,
      membership.clientHub.name,
      url,
      hasPassword,
      emailChromeFromKit(
        await readClientHubBrandKit(control, membership.clientHub.id),
        membership.clientHub.name
      )
    );
  } catch (err) {
    console.error("client hub member resend failed", membership.clientHub.slug, err);
    return {
      error: `Email failed (${err instanceof Error ? err.message : "unknown error"}). Check RESEND.`,
    };
  }
  return { error: null };
}

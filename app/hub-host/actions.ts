"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicHubSignupSchema, signupSchema } from "@/lib/validations/signup";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { activateHubMembership, findHubInviteByToken } from "@/lib/hub/membership";
import { joinClientHubAsFan } from "@/lib/hub/joinAsFan";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rateLimit";

const FAN_SIGNUP_MAX = 5;
const FAN_SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export type HubAuthFormState = {
  error: string;
  href?: string;
  hrefLabel?: string;
} | null;

export async function completeClientHubSignup(
  _prevState: HubAuthFormState,
  formData: FormData
): Promise<HubAuthFormState> {
  const parsed = signupSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" || !ctx.hub) {
    return { error: "Open this invite on your hub’s own URL — not hub.triforgemedia.com." };
  }

  const { token, password } = parsed.data;
  const invite = await findHubInviteByToken(token, ctx.hub.id);
  if (!invite) {
    return { error: "This invite link is invalid, expired, or has already been used." };
  }

  if (invite.user.passwordHash) {
    return {
      error: "You already have a login. Sign in with that password to join this hub.",
      href: "/signin",
      hrefLabel: "Sign in",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const control = getControlPrisma();
  await control.user.update({
    where: { id: invite.user.id },
    data: { passwordHash, status: "ACTIVE" },
  });
  await activateHubMembership(invite.id);

  redirect("/signin?welcome=1");
}

export async function completePublicClientHubSignup(
  _prevState: HubAuthFormState,
  formData: FormData
): Promise<HubAuthFormState> {
  const parsed = publicHubSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { name, email, password } = parsed.data;
  const ip = getClientIpFromHeaders(headers());
  const ipLimit = checkRateLimit(`fan-signup-ip:${ip}`, FAN_SIGNUP_MAX, FAN_SIGNUP_WINDOW_MS);
  const emailLimit = checkRateLimit(`fan-signup-email:${email}`, FAN_SIGNUP_MAX, FAN_SIGNUP_WINDOW_MS);
  if (ipLimit.limited || emailLimit.limited) {
    return { error: "Too many signup attempts from this connection. Please try again later." };
  }

  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" || !ctx.hub?.tenantDbName) {
    return { error: "Open this page on the hub’s own URL to create a fan account." };
  }
  const control = getControlPrisma();
  const existing = await control.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, status: true },
  });

  if (existing?.status === "BANNED") {
    return { error: "This email can’t join this hub." };
  }
  if (existing?.passwordHash) {
    return {
      error:
        "That email already has a login. Sign in — if you’re on the network, your profile comes with you as a fan.",
      href: `/signin?email=${encodeURIComponent(email)}`,
      hrefLabel: "Sign in",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user =
    existing ??
    (await control.user.create({
      data: {
        email,
        name,
        role: "MEMBER",
        status: "ACTIVE",
        platformAccess: false,
        passwordHash,
      },
    }));

  if (existing) {
    await control.user.update({
      where: { id: existing.id },
      data: { passwordHash, status: "ACTIVE", name: name || undefined },
    });
  }

  const joined = await joinClientHubAsFan({
    userId: user.id,
    clientHubId: ctx.hub.id,
    tenantDbName: ctx.hub.tenantDbName,
  });
  if (joined === "banned") {
    return { error: "This email can’t join this hub." };
  }

  redirect("/signin?welcome=1");
}

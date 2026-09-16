"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signupSchema } from "@/lib/validations/signup";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { activateHubMembership, findHubInviteByToken } from "@/lib/hub/membership";

export async function completeClientHubSignup(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
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
    return { error: "You already have a login. Sign in with that password to join this hub." };
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

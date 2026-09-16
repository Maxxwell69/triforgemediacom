"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signupSchema } from "@/lib/validations/signup";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";

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
  if (ctx.kind !== "client" || !ctx.prisma) {
    return { error: "Open this invite on your hub’s own URL — not hub.triforgemedia.com." };
  }

  const { token, password } = parsed.data;
  const application = await ctx.prisma.application.findUnique({
    where: { inviteToken: token },
    include: { user: true },
  });

  const expired =
    !!application?.inviteTokenExpiresAt && application.inviteTokenExpiresAt.getTime() <= Date.now();

  if (!application || application.status !== "APPROVED" || application.user.status !== "INVITED" || expired) {
    return { error: "This invite link is invalid, expired, or has already been used." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await ctx.prisma.$transaction([
    ctx.prisma.user.update({
      where: { id: application.userId },
      data: { passwordHash, status: "ACTIVE" },
    }),
    ctx.prisma.application.update({
      where: { id: application.id },
      data: { inviteToken: null, inviteTokenExpiresAt: null },
    }),
  ]);

  redirect("/signin?welcome=1");
}

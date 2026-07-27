"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/signup";

export type SignupResult = { error: string } | never;

export async function completeSignup(
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

  const { token, password } = parsed.data;

  const application = await prisma.application.findUnique({
    where: { inviteToken: token },
    include: { user: true },
  });

  const expired =
    !!application?.inviteTokenExpiresAt && application.inviteTokenExpiresAt.getTime() <= Date.now();

  if (!application || application.status !== "APPROVED" || application.user.status !== "INVITED" || expired) {
    return { error: "This invite link is invalid, expired, or has already been used." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: application.userId },
      data: { passwordHash, status: "ACTIVE" },
    }),
    prisma.application.update({
      where: { id: application.id },
      data: { inviteToken: null, inviteTokenExpiresAt: null },
    }),
  ]);

  redirect("/login?welcome=1");
}

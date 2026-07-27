"use server";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/passwordReset";
import { generateResetToken, resetPasswordUrl, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

export type ForgotPasswordState = { error: string; sent?: false } | { sent: true; error?: never };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState | null,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  // Always report success either way — don't leak whether an email is registered.
  if (user && user.status === "ACTIVE") {
    const token = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    await sendPasswordResetEmail(user.email, user.name || "there", resetPasswordUrl(token));
  }

  return { sent: true };
}

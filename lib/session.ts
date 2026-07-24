import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Gate for modules that need a completed Profile (chat, TikTask). Redirects
 * to /login if unauthenticated, or /onboarding if the user hasn't set up
 * their profile yet.
 */
export async function requireProfile() {
  const user = await requireUser();

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    redirect("/onboarding");
  }

  return { user, profile };
}

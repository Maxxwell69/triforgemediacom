import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";

/**
 * Sessions are JWTs that can live for weeks — role/status are only stamped
 * onto the token at login time. Re-checking against the database here means
 * a ban or role change takes effect on the user's very next request instead
 * of waiting for their existing session to expire.
 */
export async function getFreshSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status === "BANNED") return null;

  return { ...session.user, role: dbUser.role, status: dbUser.status };
}

export async function requireUser() {
  const user = await getFreshSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
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

/**
 * Gate for the whole /admin section's shared layout — checked once here so
 * every admin page gets a live (non-JWT-stale) role/status check on render,
 * not just on the mutations in each actions.ts. Without this, a demoted or
 * banned admin whose JWT hadn't expired yet could still view admin pages
 * (read-only data exposure) even though write actions were already blocked.
 */
export async function requireAdminPage() {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    redirect("/login");
  }
  return user;
}

/**
 * Hub-maker / Obtainable Hub control plane. ADMIN only.
 * If SUPERADMIN_EMAILS is set, the account email must also be on that list.
 */
export async function requireSuperAdminPage() {
  const user = await requireAdminPage();
  if (user.role !== "ADMIN") {
    notFound();
  }
  const allow = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length > 0) {
    const email = (user.email || "").toLowerCase();
    if (!allow.includes(email)) {
      notFound();
    }
  }
  return user;
}

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isTrueAdmin } from "@/lib/rbac";
import { publicOriginFromHeaders } from "@/lib/hub/host";
import { copyControlProfileToTenant, ensureTenantMember } from "@/lib/hub/ensureTenantMember";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import type { UserRole, UserStatus } from "@prisma/client";

function redirectHere(path: string): never {
  const origin = publicOriginFromHeaders(headers());
  redirect(origin ? `${origin}${path}` : path);
}

function redirectToSignIn(): never {
  const pathname = headers().get("x-pathname") || "";
  const safe =
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    !pathname.startsWith("/signin") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/hub-host/") &&
    !pathname.startsWith("/api/");
  const qs = safe ? `?callbackUrl=${encodeURIComponent(pathname)}` : "";
  redirectHere(`/signin${qs}`);
}

/**
 * Sessions are JWTs that can live for weeks — role/status are only stamped
 * onto the token at login time. Re-checking against the database here means
 * a ban or role change takes effect on the user's very next request instead
 * of waiting for their existing session to expire.
 */
export async function getFreshSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const identity = await getControlPrisma().user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, image: true, role: true, status: true, platformAccess: true },
  });
  if (!identity || identity.status === "BANNED") return null;

  const ctx = await getRequestHubContext();
  if (ctx.kind === "platform") {
    if (!identity.platformAccess) return null;
    return { ...session.user, role: identity.role, status: identity.status };
  }

  if (ctx.kind !== "client" || !ctx.prisma || !ctx.hub) return null;

  const membership = await getControlPrisma().hubMembership.findUnique({
    where: { userId_clientHubId: { userId: session.user.id, clientHubId: ctx.hub.id } },
    select: { status: true, role: true, tenantUserId: true },
  });
  if (!membership || membership.status === "BANNED") return null;

  const lookupIds = [membership.tenantUserId, session.user.id].filter(
    (id, index, all): id is string => !!id && all.indexOf(id) === index
  );
  let tenantUser: { id: string; role: UserRole; status: UserStatus } | null = null;
  for (const id of lookupIds) {
    tenantUser = await ctx.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, status: true },
    });
    if (tenantUser) break;
  }
  if (!tenantUser) {
    tenantUser = await ctx.prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true, role: true, status: true },
    });
  }
  if (!tenantUser && ctx.hub.tenantDbName) {
    try {
      const tenantId = await ensureTenantMember({
        tenantDbName: ctx.hub.tenantDbName,
        user: {
          id: session.user.id,
          email: identity.email,
          name: identity.name,
          image: identity.image,
        },
        role: membership.role,
        status: "ACTIVE",
      });
      tenantUser = await ctx.prisma.user.findUnique({
        where: { id: tenantId },
        select: { id: true, role: true, status: true },
      });
    } catch (err) {
      console.error("heal tenant member on session failed", session.user.id, err);
    }
  }
  if (!tenantUser || tenantUser.status === "BANNED") return null;

  return { ...session.user, role: tenantUser.role, status: tenantUser.status };
}

export async function requireUser() {
  const user = await getFreshSessionUser();
  if (!user) {
    redirectToSignIn();
  }
  return user;
}

/**
 * Tenant Profile for this request. Control-plane user.id can differ from the
 * hub_* User/Profile id — HubMembership.tenantUserId is the one chat/voice use.
 */
export async function loadProfileForUser(user: { id: string }) {
  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (profile) return profile;

  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" || !ctx.prisma) return null;

  const membership = await getControlPrisma().hubMembership.findUnique({
    where: { userId_clientHubId: { userId: user.id, clientHubId: ctx.hub.id } },
    select: { tenantUserId: true },
  });
  const tenantUserId = membership?.tenantUserId || user.id;
  if (tenantUserId !== user.id) {
    profile = await prisma.profile.findUnique({ where: { userId: tenantUserId } });
  }
  if (!profile) {
    profile = await copyControlProfileToTenant(user.id, tenantUserId, ctx.prisma);
  }
  return profile;
}

/**
 * Gate for modules that need a completed Profile (chat, TikTask). Redirects
 * to /signin if unauthenticated, or /onboarding if the user hasn't set up
 * their profile yet.
 */
export async function requireProfile() {
  const user = await requireUser();
  const profile = await loadProfileForUser(user);
  if (!profile) {
    redirectHere("/onboarding");
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
    redirectToSignIn();
  }
  return user;
}

/**
 * Hub-maker / Obtainable Hub control plane. ADMIN only.
 * If SUPERADMIN_EMAILS is set, the account email must also be on that list.
 */
export async function requireSuperAdminPage() {
  const user = await requireAdminPage();
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "platform" || !isTrueAdmin(user.role)) {
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

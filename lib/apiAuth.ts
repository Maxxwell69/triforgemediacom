import type { Profile } from "@prisma/client";
import { getFreshSessionUser, loadProfileForUser } from "@/lib/session";

type SessionUser = NonNullable<Awaited<ReturnType<typeof getFreshSessionUser>>>;

type ApiAuthResult =
  | { error: "unauthorized" | "no-profile" }
  | { user: SessionUser; profile: Profile };

/**
 * API-route equivalent of lib/session.ts's requireProfile(): returns a typed
 * result instead of redirecting, since API routes can't use next/navigation.
 * Uses getFreshSessionUser() so a ban takes effect immediately rather than
 * waiting for the caller's session to expire.
 * On client hubs, user.id is the tenant User id (voice / DMs / chat).
 */
export async function getApiUserWithProfile(): Promise<ApiAuthResult> {
  const user = await getFreshSessionUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const profile = await loadProfileForUser(user);
  if (!profile) {
    return { error: "no-profile" };
  }

  const tenantUser = profile.userId !== user.id ? { ...user, id: profile.userId } : user;
  return { user: tenantUser, profile };
}

export function apiAuthErrorResponse(error: "unauthorized" | "no-profile") {
  return {
    status: error === "unauthorized" ? 401 : 403,
    body: {
      error:
        error === "unauthorized"
          ? "You must be signed in."
          : "Complete your profile setup first.",
    },
  };
}

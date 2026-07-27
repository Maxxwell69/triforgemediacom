import type { Profile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFreshSessionUser } from "@/lib/session";

type ApiAuthResult =
  | { error: "unauthorized" | "no-profile" }
  | { user: NonNullable<Awaited<ReturnType<typeof getFreshSessionUser>>>; profile: Profile };

/**
 * API-route equivalent of lib/session.ts's requireProfile(): returns a typed
 * result instead of redirecting, since API routes can't use next/navigation.
 * Uses getFreshSessionUser() so a ban takes effect immediately rather than
 * waiting for the caller's session to expire.
 */
export async function getApiUserWithProfile(): Promise<ApiAuthResult> {
  const user = await getFreshSessionUser();
  if (!user) {
    return { error: "unauthorized" };
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { error: "no-profile" };
  }

  return { user, profile };
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

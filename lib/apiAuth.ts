import type { Session } from "next-auth";
import type { Profile } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ApiAuthResult =
  | { error: "unauthorized" | "no-profile" }
  | { user: Session["user"]; profile: Profile };

/**
 * API-route equivalent of lib/session.ts's requireProfile(): returns a typed
 * result instead of redirecting, since API routes can't use next/navigation.
 */
export async function getApiUserWithProfile(): Promise<ApiAuthResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "unauthorized" };
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    return { error: "no-profile" };
  }

  return { user: session.user, profile };
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

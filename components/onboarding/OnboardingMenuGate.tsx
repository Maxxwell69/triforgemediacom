import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getOnboardingMenuLock } from "@/lib/onboarding/engine";
import { isOnboardingMenuPathAllowed } from "@/lib/onboarding/menu";

export default async function OnboardingMenuGate({
  userId,
  role,
  allowedIds,
  extraAllowedPrefixes = [],
}: {
  userId: string;
  role: UserRole;
  allowedIds?: Set<string> | null;
  extraAllowedPrefixes?: readonly string[];
}) {
  const lock = allowedIds === undefined ? await getOnboardingMenuLock(userId, role) : allowedIds;
  if (!lock) return null;
  const pathname = headers().get("x-pathname") || "";
  if (!pathname) return null;
  if (!isOnboardingMenuPathAllowed(pathname, lock, extraAllowedPrefixes)) {
    redirect("/home");
  }
  return null;
}

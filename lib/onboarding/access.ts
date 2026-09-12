import "server-only";

import { notFound } from "next/navigation";
import { hubHas } from "@/lib/hub/modules";

export function onboardingEnabled() {
  return hubHas("onboardingChecklist");
}

export function requireOnboardingModule() {
  if (!onboardingEnabled()) notFound();
}

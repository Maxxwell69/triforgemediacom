import "server-only";

import { notFound } from "next/navigation";
import { hubHas } from "@/lib/hub/modules";

export function requireSocialPlannerModule() {
  if (!hubHas("socialPlanner")) notFound();
}

export function socialPlannerEnabled() {
  return hubHas("socialPlanner");
}

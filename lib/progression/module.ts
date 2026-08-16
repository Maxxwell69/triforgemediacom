import "server-only";

import { notFound } from "next/navigation";
import { hubHas } from "@/lib/hub/modules";

export function requireProgressionModule() {
  if (!hubHas("progression")) notFound();
}

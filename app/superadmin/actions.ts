"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSuperAdminPage } from "@/lib/session";
import { ALL_SKU_IDS, isHubSkuId } from "@/lib/hub/catalog";
import { DRY_RUN_ENABLED_COOKIE } from "@/lib/hub/modules";

function cookieOpts() {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function saveDryRunModulesAction(formData: FormData) {
  await requireSuperAdminPage();

  const enabled = new Set<string>(["core"]);
  for (const value of formData.getAll("sku")) {
    if (typeof value === "string" && isHubSkuId(value) && value !== "core") {
      enabled.add(value);
    }
  }

  const payload = ALL_SKU_IDS.filter((id) => enabled.has(id)).join(",");
  cookies().set(DRY_RUN_ENABLED_COOKIE, payload, cookieOpts());
  revalidatePath("/", "layout");
  revalidatePath("/superadmin");
  revalidatePath("/admin");
}

export async function resetDryRunModulesAction() {
  await requireSuperAdminPage();
  cookies().delete(DRY_RUN_ENABLED_COOKIE);
  revalidatePath("/", "layout");
  revalidatePath("/superadmin");
  revalidatePath("/admin");
}

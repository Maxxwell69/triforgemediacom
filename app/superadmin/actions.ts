"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/session";
import { ALL_SKU_IDS, isHubSkuId } from "@/lib/hub/catalog";
import { DRY_RUN_ENABLED_COOKIE } from "@/lib/hub/modules";
import {
  HUB_SETUP_STEPS,
  parseHubSkuIds,
  validateHubInput,
  type SetupStepId,
} from "@/lib/hub/clientHubs";

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

export async function createClientHubAction(formData: FormData): Promise<{ error: string } | void> {
  const user = await requireSuperAdminPage();
  const parsed = validateHubInput({
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    email: String(formData.get("email") || ""),
  });
  if (!parsed.ok) return { error: parsed.error };

  try {
    const hub = await prisma.clientHub.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        clientAdminEmail: parsed.email,
        notes: String(formData.get("notes") || "").trim() || null,
        enabledSkuIds: parseHubSkuIds(formData.getAll("sku")),
        createdById: user.id,
      },
    });
    revalidatePath("/superadmin");
    redirect(`/superadmin/${hub.id}`);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `Slug “${parsed.slug}” is already used.` };
    }
    throw err;
  }
}

export async function saveClientHubAction(formData: FormData): Promise<{ error: string } | void> {
  await requireSuperAdminPage();
  const hubId = String(formData.get("hubId") || "");
  if (!hubId) return { error: "Missing hub." };

  const parsed = validateHubInput({
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    email: String(formData.get("email") || ""),
  });
  if (!parsed.ok) return { error: parsed.error };

  try {
    await prisma.clientHub.update({
      where: { id: hubId },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        clientAdminEmail: parsed.email,
        notes: String(formData.get("notes") || "").trim() || null,
        enabledSkuIds: parseHubSkuIds(formData.getAll("sku")),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: `Slug “${parsed.slug}” is already used.` };
    }
    throw err;
  }

  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/${hubId}`);
}

export async function toggleHubSetupStepAction(formData: FormData) {
  await requireSuperAdminPage();
  const hubId = String(formData.get("hubId") || "");
  const stepId = String(formData.get("stepId") || "") as SetupStepId;
  const step = HUB_SETUP_STEPS.find((row) => row.id === stepId);
  if (!hubId || !step) return;

  const hub = await prisma.clientHub.findUnique({ where: { id: hubId } });
  if (!hub) return;

  const current = hub[step.field];
  await prisma.clientHub.update({
    where: { id: hubId },
    data: { [step.field]: current ? null : new Date() },
  });

  revalidatePath("/superadmin");
  revalidatePath(`/superadmin/${hubId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { parseBrandKit, validateBrandKit } from "@/lib/hub/brandKit";
import { writeClientHubBrandKit } from "@/lib/hub/brandKitStore";

const DESCRIPTION_MAX = 400;

function parseImageUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    throw new Error("Image must be an https URL.");
  }
  return value.slice(0, 2000);
}

export async function saveHubDirectoryProfile(formData: FormData) {
  await requireAdminPage();
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    throw new Error("Hub profile is only for Create Hub communities.");
  }

  const description = String(formData.get("directoryDescription") || "").trim().slice(0, DESCRIPTION_MAX);
  let imageUrl: string | null = null;
  try {
    imageUrl = parseImageUrl(String(formData.get("directoryImageUrl") || ""));
  } catch {
    redirect("/admin/hub-profile?error=1");
  }
  const wantPublic = formData.get("directoryPublic") === "on";

  await ctx.control.clientHub.update({
    where: { id: ctx.hub.id },
    data: {
      directoryDescription: description || null,
      directoryImageUrl: imageUrl,
      directoryPublic: wantPublic,
    },
  });

  revalidatePath("/hubs");
  revalidatePath("/admin/hub-profile");
  redirect("/admin/hub-profile?saved=1");
}

async function requireClientHub() {
  await requireAdminPage();
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    throw new Error("Hub profile is only for Create Hub communities.");
  }
  return ctx;
}

export async function saveHubBrandKit(formData: FormData) {
  const ctx = await requireClientHub();
  const kit = parseBrandKit({
    logoUrl: String(formData.get("logoUrl") || ""),
    backgroundImageUrl: String(formData.get("backgroundImageUrl") || ""),
    colors: {
      canvas: String(formData.get("canvas") || ""),
      primary: String(formData.get("primary") || ""),
      secondary: String(formData.get("secondary") || ""),
      ink: String(formData.get("ink") || ""),
      button: String(formData.get("button") || ""),
      buttonInk: String(formData.get("buttonInk") || ""),
    },
    fonts: {
      display: String(formData.get("displayFont") || ""),
      body: String(formData.get("bodyFont") || ""),
    },
    overlay: Number(formData.get("overlay")),
  });
  const issues = validateBrandKit(kit);
  if (issues.length > 0) {
    redirect(`/admin/hub-profile?brandError=${encodeURIComponent(issues[0].message)}`);
  }

  await writeClientHubBrandKit(ctx.control, ctx.hub.id, kit);

  revalidatePath("/admin/hub-profile");
  revalidatePath("/", "layout");
  revalidatePath("/home");
  redirect("/admin/hub-profile?brandSaved=1");
}

export async function resetHubBrandKit() {
  const ctx = await requireClientHub();
  await writeClientHubBrandKit(ctx.control, ctx.hub.id, null);
  revalidatePath("/admin/hub-profile");
  revalidatePath("/", "layout");
  revalidatePath("/home");
  redirect("/admin/hub-profile?brandSaved=1");
}

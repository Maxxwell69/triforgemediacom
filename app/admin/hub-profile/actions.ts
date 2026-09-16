"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";

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

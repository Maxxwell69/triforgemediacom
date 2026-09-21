"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { parseBrandKit, validateBrandKit } from "@/lib/hub/brandKit";
import { writeClientHubBrandKit } from "@/lib/hub/brandKitStore";
import {
  readClientHubCustomDomainSetup,
  validateCustomDomain,
  writeClientHubCustomDomain,
} from "@/lib/hub/customDomain";
import {
  attachCloudflareCustomHostname,
  cloudflareCustomDomainReady,
  cloudflareManualSetup,
  detachCloudflareCustomHostname,
  refreshCloudflareCustomHostname,
} from "@/lib/hub/cloudflareCustomDomain";
import {
  detachRailwayCustomDomain,
} from "@/lib/hub/railwayCustomDomain";

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
    cardOpacity: Number(formData.get("cardOpacity")),
    surfaces: {
      menu: {
        canvas: String(formData.get("menuCanvas") || ""),
        ink: String(formData.get("menuInk") || ""),
        backgroundImageUrl: String(formData.get("menuBackgroundImageUrl") || ""),
        overlay: Number(formData.get("menuOverlay")),
      },
      groups: {
        canvas: String(formData.get("groupsCanvas") || ""),
        ink: String(formData.get("groupsInk") || ""),
        backgroundImageUrl: String(formData.get("groupsBackgroundImageUrl") || ""),
        overlay: Number(formData.get("groupsOverlay")),
      },
      chat: {
        canvas: String(formData.get("chatCanvas") || ""),
        ink: String(formData.get("chatInk") || ""),
        backgroundImageUrl: String(formData.get("chatBackgroundImageUrl") || ""),
        overlay: Number(formData.get("chatOverlay")),
      },
    },
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

export async function saveHubCustomDomain(formData: FormData) {
  const ctx = await requireClientHub();
  const previous = await readClientHubCustomDomainSetup(ctx.control, ctx.hub.id);
  const raw = String(formData.get("customDomain") || "").trim();
  if (!raw) {
    await detachCloudflareCustomHostname(previous?.cloudflareId);
    await detachRailwayCustomDomain(previous?.railwayId);
    await writeClientHubCustomDomain(ctx.control, ctx.hub.id, null);
    revalidatePath("/admin/hub-profile");
    revalidatePath("/hubs");
    revalidatePath("/", "layout");
    redirect("/admin/hub-profile?domainSaved=1");
  }

  const parsed = validateCustomDomain(raw);
  if (!parsed.ok) {
    redirect(`/admin/hub-profile?domainError=${encodeURIComponent(parsed.error)}`);
  }

  try {
    if (previous?.host && previous.host !== parsed.host) {
      await detachCloudflareCustomHostname(previous.cloudflareId);
      await detachRailwayCustomDomain(previous.railwayId);
    }
    if (previous?.railwayId) await detachRailwayCustomDomain(previous.railwayId);
    let setup;
    if (cloudflareCustomDomainReady()) {
      setup = await attachCloudflareCustomHostname(parsed.host);
    } else {
      setup = cloudflareManualSetup(parsed.host);
      if (previous?.cloudflareId) setup = { ...setup, cloudflareId: previous.cloudflareId };
    }
    await writeClientHubCustomDomain(ctx.control, ctx.hub.id, parsed.host, setup);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save that domain. Try again.";
    redirect(`/admin/hub-profile?domainError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/hub-profile");
  revalidatePath("/hubs");
  revalidatePath("/", "layout");
  redirect("/admin/hub-profile?domainSaved=1");
}

function isNextRedirect(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function refreshHubCustomDomain() {
  try {
    const ctx = await requireClientHub();
    const previous = await readClientHubCustomDomainSetup(ctx.control, ctx.hub.id);
    if (!previous?.host) {
      redirect("/admin/hub-profile?domainError=Save%20a%20hostname%20first.");
    }
    const setup = cloudflareCustomDomainReady()
      ? await refreshCloudflareCustomHostname(previous.host, previous.cloudflareId)
      : {
          ...cloudflareManualSetup(previous.host),
          ...(previous.cloudflareId ? { cloudflareId: previous.cloudflareId } : {}),
        };
    await writeClientHubCustomDomain(ctx.control, ctx.hub.id, previous.host, setup);
    revalidatePath("/admin/hub-profile");
    redirect("/admin/hub-profile?domainSaved=1");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    const message =
      err instanceof Error ? err.message : "Could not refresh HTTPS status.";
    redirect(`/admin/hub-profile?domainError=${encodeURIComponent(message)}`);
  }
}

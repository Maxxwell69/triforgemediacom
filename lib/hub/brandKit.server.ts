import "server-only";

import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import {
  DEFAULT_BRAND_KIT,
  emailChromeFromKit,
  type BrandKit,
  type EmailBrandChrome,
} from "@/lib/hub/brandKit";
import { readClientHubBrandKit } from "@/lib/hub/brandKitStore";

export async function loadRequestBrandKit(): Promise<{
  kit: BrandKit;
  hubName: string | null;
  isClient: boolean;
}> {
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    return { kit: DEFAULT_BRAND_KIT, hubName: null, isClient: false };
  }

  const row = await ctx.control.clientHub.findUnique({
    where: { id: ctx.hub.id },
    select: { name: true },
  });
  const kit = await readClientHubBrandKit(ctx.control, ctx.hub.id);

  return {
    kit,
    hubName: row?.name ?? ctx.hub.name,
    isClient: true,
  };
}

export async function loadEmailChromeForRequest(): Promise<EmailBrandChrome | undefined> {
  const { kit, hubName, isClient } = await loadRequestBrandKit();
  if (!isClient) return undefined;
  return emailChromeFromKit(kit, hubName || "Hub");
}

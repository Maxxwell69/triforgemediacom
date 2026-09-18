import "server-only";

import { hubPublicHost, hubPublicUrl } from "@/lib/hub/host";
import { readCustomDomainsByHubIds } from "@/lib/hub/customDomain";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";

export { hub0PublicUrl, hub0PublicHost } from "@/lib/hub/host";

export type DirectoryHub = {
  id: string;
  name: string;
  slug: string;
  host: string;
  href: string;
  createdAt: Date;
  provisioned: boolean;
  description: string | null;
  imageUrl: string | null;
};

export function clientHubPublicUrl(slug: string, customDomain?: string | null) {
  return hubPublicUrl({ slug, customDomain });
}

export async function listDirectoryHubs(): Promise<DirectoryHub[]> {
  const hubs = await getControlPrisma().clientHub.findMany({
    where: { directoryPublic: true, tenantDbAt: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      tenantDbAt: true,
      directoryDescription: true,
      directoryImageUrl: true,
    },
  });
  const domains = await readCustomDomainsByHubIds(
    getControlPrisma(),
    hubs.map((hub) => hub.id)
  );
  return hubs.map((hub) => {
    const customDomain = domains.get(hub.id) ?? null;
    return {
      id: hub.id,
      name: hub.name,
      slug: hub.slug,
      host: hubPublicHost({ slug: hub.slug, customDomain }),
      href: hubPublicUrl({ slug: hub.slug, customDomain }),
      createdAt: hub.createdAt,
      provisioned: !!hub.tenantDbAt,
      description: hub.directoryDescription,
      imageUrl: hub.directoryImageUrl,
    };
  });
}

export async function userHasForgeHubAccess(userId: string) {
  const user = await getControlPrisma().user.findUnique({
    where: { id: userId },
    select: { platformAccess: true, status: true },
  });
  return Boolean(user?.platformAccess && user.status !== "BANNED");
}

export async function listMyHubMemberships(userId: string) {
  const rows = await getControlPrisma().hubMembership.findMany({
    where: { userId, status: { in: ["INVITED", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      status: true,
      clientHub: {
        select: {
          id: true,
          name: true,
          slug: true,
          tenantDbAt: true,
          directoryPublic: true,
          directoryDescription: true,
          directoryImageUrl: true,
        },
      },
    },
  });
  const domains = await readCustomDomainsByHubIds(
    getControlPrisma(),
    rows.map((row) => row.clientHub.id)
  );
  return rows.map((row) => ({
    ...row,
    clientHub: {
      ...row.clientHub,
      customDomain: domains.get(row.clientHub.id) ?? null,
    },
  }));
}

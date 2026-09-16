import "server-only";

import { clientHubPublicHost } from "@/lib/hub/host";
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
};

export function clientHubPublicUrl(slug: string) {
  return `https://${clientHubPublicHost(slug)}`;
}

export async function listDirectoryHubs(): Promise<DirectoryHub[]> {
  const hubs = await getControlPrisma().clientHub.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      tenantDbAt: true,
    },
  });
  return hubs.map((hub) => ({
    id: hub.id,
    name: hub.name,
    slug: hub.slug,
    host: clientHubPublicHost(hub.slug),
    href: clientHubPublicUrl(hub.slug),
    createdAt: hub.createdAt,
    provisioned: !!hub.tenantDbAt,
  }));
}

export async function userHasForgeHubAccess(userId: string) {
  const user = await getControlPrisma().user.findUnique({
    where: { id: userId },
    select: { platformAccess: true, status: true },
  });
  return Boolean(user?.platformAccess && user.status !== "BANNED");
}

export async function listMyHubMemberships(userId: string) {
  return getControlPrisma().hubMembership.findMany({
    where: { userId, status: { in: ["INVITED", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      status: true,
      clientHub: {
        select: { id: true, name: true, slug: true, tenantDbAt: true },
      },
    },
  });
}

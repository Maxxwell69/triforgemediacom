import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getControlPrisma, pingTenantSchema } from "@/lib/hub/tenantPrisma";
import { requireSuperAdminPage } from "@/lib/session";
import { OPTIONAL_SKUS } from "@/lib/hub/catalog";
import { clientHubPublicUrl } from "@/lib/hub/directory";
import { readClientHubCustomDomain } from "@/lib/hub/customDomain";
import { listPlatformHubStaff } from "@/lib/hub/staffAccess";
import HubSetupForm from "@/components/superadmin/HubSetupForm";
import SuperAdminSubnav from "@/components/superadmin/SuperAdminSubnav";

export const dynamic = "force-dynamic";

export default async function SuperAdminHubPage({ params }: { params: { hubId: string } }) {
  await requireSuperAdminPage();
  const pathname = headers().get("x-pathname") || `/superadmin/${params.hubId}`;
  const control = getControlPrisma();
  const hub = await control.clientHub.findUnique({ where: { id: params.hubId } });
  if (!hub) notFound();

  const [tenantPing, staffUsers] = await Promise.all([
    hub.tenantDbName ? pingTenantSchema(hub.tenantDbName) : Promise.resolve(null),
    listPlatformHubStaff(),
  ]);
  const staffMemberships = await control.hubMembership.findMany({
    where: { clientHubId: hub.id, userId: { in: staffUsers.map((row) => row.id) } },
    select: { userId: true, status: true },
  });
  const membershipByUser = new Map(staffMemberships.map((row) => [row.userId, row.status]));
  const staff = staffUsers.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    membershipStatus: membershipByUser.get(row.id) ?? null,
  }));

  const customDomain = await readClientHubCustomDomain(control, hub.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/superadmin" className="font-body text-sm text-off-white/50 hover:text-off-white">
        ← Create Hub
      </Link>
      <SuperAdminSubnav pathname={pathname} />
      <h1 className="mt-3 font-display text-5xl tracking-wide">
        {hub.name.toUpperCase()}
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        {hub.slug}.hub.triforgemedia.com — record is saved. Work the list below.
        {customDomain ? ` Custom domain: ${customDomain}.` : ""}
      </p>
      <div className="mt-8">
        <HubSetupForm
          hub={hub}
          optional={OPTIONAL_SKUS}
          tenantPing={tenantPing}
          hubHref={clientHubPublicUrl(hub.slug, customDomain)}
          staff={staff}
        />
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/session";
import { OPTIONAL_SKUS } from "@/lib/hub/catalog";
import HubSetupForm from "@/components/superadmin/HubSetupForm";

export const dynamic = "force-dynamic";

export default async function SuperAdminHubPage({ params }: { params: { hubId: string } }) {
  await requireSuperAdminPage();
  const hub = await prisma.clientHub.findUnique({ where: { id: params.hubId } });
  if (!hub) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/superadmin" className="font-body text-sm text-off-white/50 hover:text-off-white">
        ← Create Hub
      </Link>
      <h1 className="mt-3 font-display text-5xl tracking-wide">
        {hub.name.toUpperCase()}
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        {hub.slug}.hub.triforgemedia.com — record is saved. Work the list below.
      </p>
      <div className="mt-8">
        <HubSetupForm hub={hub} optional={OPTIONAL_SKUS} />
      </div>
    </main>
  );
}

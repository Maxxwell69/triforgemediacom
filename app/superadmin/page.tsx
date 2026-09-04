import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminPage } from "@/lib/session";
import { CORE_SKUS, OPTIONAL_SKUS, FLAGSHIP_SKUS } from "@/lib/hub/catalog";
import { getEnabledSkuIds } from "@/lib/hub/modules";
import { defaultClientSkuIds, nextSetupStep } from "@/lib/hub/clientHubs";
import SuperAdminModuleForm from "@/components/superadmin/SuperAdminModuleForm";
import CreateHubForm from "@/components/superadmin/CreateHubForm";

export const dynamic = "force-dynamic";

export default async function SuperAdminHubsPage() {
  await requireSuperAdminPage();
  const initialEnabled = Array.from(getEnabledSkuIds());
  const hubs = await prisma.clientHub.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      clientAdminEmail: true,
      dnsCnameAt: true,
      railwayDomainAt: true,
      tenantDbAt: true,
      adminInvitedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
        Admin only · not shown to members or mods
      </p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">
        CREATE <span className="text-gradient">HUB</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Save the hub record first (name, slug, client email, SKUs). Optional modules start
        unchecked. Then open it and work the setup list. Client hostnames never open Hub 0.
      </p>

      {hubs.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Saved hubs</h2>
          <ul className="mt-3 space-y-2">
            {hubs.map((hub) => {
              const next = nextSetupStep(hub);
              return (
                <li key={hub.id}>
                  <Link
                    href={`/superadmin/${hub.id}`}
                    className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition hover:border-cyan/40"
                  >
                    <div>
                      <p className="font-body text-sm text-off-white">{hub.name}</p>
                      <p className="font-body text-[11px] text-off-white/45">
                        {hub.slug}.hub.triforgemedia.com · {hub.clientAdminEmail}
                      </p>
                    </div>
                    <p className="shrink-0 font-body text-[11px] uppercase tracking-wide text-orange">
                      {next ? next.label : "Setup complete"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New hub</h2>
        <CreateHubForm optional={OPTIONAL_SKUS} defaultEnabled={defaultClientSkuIds()} />
      </section>

      <details className="mt-12 rounded-2xl border border-off-white/10 px-4 py-3">
        <summary className="cursor-pointer font-body text-sm text-off-white/55">
          Preview SKUs on this browser (Hub 0 dry run)
        </summary>
        <p className="mt-2 font-body text-xs text-off-white/40">
          Uncheck modules, then Save preview. Admin and member menus hide those SKUs in this
          browser only. No hub is created.
        </p>
        <SuperAdminModuleForm
          core={CORE_SKUS}
          optional={OPTIONAL_SKUS}
          flagship={FLAGSHIP_SKUS}
          initialEnabled={initialEnabled}
        />
      </details>
    </main>
  );
}

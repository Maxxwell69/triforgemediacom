import { requireSuperAdminPage } from "@/lib/session";
import { CORE_SKUS, OPTIONAL_SKUS, FLAGSHIP_SKUS } from "@/lib/hub/catalog";
import { getEnabledSkuIds } from "@/lib/hub/modules";
import SuperAdminModuleForm from "@/components/superadmin/SuperAdminModuleForm";

export const dynamic = "force-dynamic";

export default async function SuperAdminHubsPage() {
  await requireSuperAdminPage();
  const initialEnabled = Array.from(getEnabledSkuIds());

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
        Super-admin · dry run
      </p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">
        CREATE <span className="text-gradient">HUB</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Uncheck modules, then <span className="text-off-white">Save preview</span>. Admin
        and member menus on this staging site will hide those SKUs in this browser.
        Provisioning (name, slug, DNS, database) is not wired yet.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-off-white/10 p-6">
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Hub name
          <input
            disabled
            placeholder="Acme Creators"
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white/50"
          />
        </label>
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Slug → {"{slug}"}.hub.triforgemedia.com
          <input
            disabled
            placeholder="acme"
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white/50"
          />
        </label>
        <label className="block font-body text-xs uppercase tracking-wide text-off-white/40">
          Client admin email
          <input
            disabled
            placeholder="admin@client.com"
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white/50"
          />
        </label>
      </div>

      <SuperAdminModuleForm
        core={CORE_SKUS}
        optional={OPTIONAL_SKUS}
        flagship={FLAGSHIP_SKUS}
        initialEnabled={initialEnabled}
      />
    </main>
  );
}

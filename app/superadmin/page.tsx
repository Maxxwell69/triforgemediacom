import { requireSuperAdminPage } from "@/lib/session";
import { CORE_SKUS, OPTIONAL_SKUS, FLAGSHIP_SKUS } from "@/lib/hub/catalog";
import { getHiddenSkuIds, hubHas } from "@/lib/hub/modules";

export const dynamic = "force-dynamic";

function SkuList({
  title,
  hint,
  skus,
}: {
  title: string;
  hint: string;
  skus: { id: string; label: string; description: string }[];
}) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-off-white">{title}</h2>
      <p className="mt-1 font-body text-xs text-off-white/45">{hint}</p>
      <ul className="mt-4 space-y-2">
        {skus.map((sku) => {
          const on = hubHas(sku.id);
          return (
            <li
              key={sku.id}
              className="flex items-start gap-3 rounded-lg border border-off-white/10 px-3 py-2"
            >
              <input type="checkbox" checked={on} readOnly className="mt-1" />
              <div>
                <p className="font-body text-sm text-off-white">{sku.label}</p>
                <p className="font-body text-[11px] text-off-white/40">
                  {sku.id}
                  {" · "}
                  {sku.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function SuperAdminHubsPage() {
  await requireSuperAdminPage();
  const hidden = Array.from(getHiddenSkuIds());

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
        Super-admin · dry run
      </p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">
        CREATE <span className="text-gradient">HUB</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        Catalog only — no database is provisioned, no DNS is changed. Checkboxes
        reflect this process&apos;s <code className="text-cyan">HUB_DRY_RUN_HIDE</code>{" "}
        list. Flagship defaults to everything on.
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
        <p className="font-body text-xs text-orange/80">
          Provisioning is not wired. This form does not create a hub.
        </p>
      </div>

      {hidden.length > 0 && (
        <p className="mt-6 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
          Dry-run hide: {hidden.join(", ")}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        <SkuList
          title="Core (every hub)"
          hint="Always on. Not a Create Hub checkbox."
          skus={CORE_SKUS}
        />
        <SkuList
          title="Optional SKUs"
          hint="Client checkboxes — member + admin together."
          skus={OPTIONAL_SKUS}
        />
        <SkuList
          title="Flagship only"
          hint="TriForge Hub 0. Never offer these to client hubs."
          skus={FLAGSHIP_SKUS}
        />
      </div>
    </main>
  );
}

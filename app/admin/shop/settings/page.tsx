import Link from "next/link";
import { requireShopModule } from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";
import { updateShopSettings } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function ConnectionRow({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
      <div>
        <p className="font-body text-sm text-off-white">{label}</p>
        <p className="mt-0.5 font-body text-xs text-off-white/40">{hint}</p>
      </div>
      <span className="shrink-0 rounded-full bg-off-white/10 px-2 py-0.5 font-body text-[11px] uppercase tracking-wide text-off-white/40">
        Next pass
      </span>
    </div>
  );
}

export default async function AdminShopSettingsPage() {
  requireShopModule();
  const settings = await getOrCreateShopSettings();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/shop"
        className="font-body text-sm text-off-white/50 transition hover:text-cyan"
      >
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        SHOP <span className="text-gradient">SETTINGS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Members only see the catalog when the shop is published.
      </p>

      <form action={updateShopSettings} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <input name="name" defaultValue={settings.name} required className={fieldClass} />
        <input
          name="currency"
          defaultValue={settings.currency}
          required
          maxLength={3}
          className={fieldClass}
        />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={settings.isPublished}
            className="h-4 w-4 accent-orange"
          />
          Publish shop to members
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Save settings
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Connections</h2>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Wired in later passes. Schema already has source + external IDs reserved.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <ConnectionRow
            label="Shopify import"
            hint="Pull products from a connected Shopify store into this catalog."
          />
          <ConnectionRow
            label="Printify"
            hint="Attach print-on-demand products and fulfill after Stripe payment."
          />
          <ConnectionRow
            label="Stripe Checkout"
            hint="Members pay on the hub. Shopify/Printify stay catalog + fulfillment."
          />
        </div>
      </section>
    </main>
  );
}

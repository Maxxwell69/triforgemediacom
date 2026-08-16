import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireShopModule } from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";
import { getShopStripeConfig, shopWebhookUrl } from "@/lib/shop/stripe";
import { isR2Configured } from "@/lib/r2";
import { updateShopSettings } from "../actions";
import CopyField from "@/components/admin/CopyField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-body text-[11px] uppercase tracking-wide ${
        ok ? "bg-cyan/15 text-cyan" : "bg-orange/15 text-orange"
      }`}
    >
      {label}
    </span>
  );
}

function CheckRow({ ok, title, hint }: { ok: boolean; title: string; hint: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
      <div>
        <p className="font-body text-sm text-off-white">{title}</p>
        <p className="mt-0.5 font-body text-xs text-off-white/40">{hint}</p>
      </div>
      <StatusPill ok={ok} label={ok ? "Ready" : "Needed"} />
    </div>
  );
}

export default async function AdminShopSettingsPage() {
  requireShopModule();
  const [settings, stripe, activeProducts] = await Promise.all([
    getOrCreateShopSettings(),
    getShopStripeConfig(),
    prisma.shopProduct.count({ where: { status: "ACTIVE" } }),
  ]);
  const r2Ready = isR2Configured();
  const webhookUrl = shopWebhookUrl();

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
        Connect Stripe and finish the storefront so members can check out.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Go-live checklist</h2>
        <div className="mt-4 flex flex-col gap-2">
          <CheckRow
            ok={stripe.hasSecret}
            title="Stripe secret key"
            hint="Paste sk_test_ / rk_test_ below, or set STRIPE_SECRET_KEY on Railway."
          />
          <CheckRow
            ok={stripe.hasWebhook}
            title="Stripe webhook secret"
            hint="Create the webhook in Stripe, then paste whsec_ here."
          />
          <CheckRow
            ok={r2Ready}
            title="File storage (R2)"
            hint="Needed for product images and digital downloads."
          />
          <CheckRow
            ok={activeProducts > 0}
            title="At least one active product"
            hint={`${activeProducts} active product${activeProducts === 1 ? "" : "s"} in the catalog.`}
          />
          <CheckRow
            ok={settings.isPublished}
            title="Shop published"
            hint="Members only see /shop when this is on."
          />
        </div>
      </section>

      <form action={updateShopSettings} className="mt-10 flex flex-col gap-8">
        <section className="glass flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Storefront</h2>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Shop name
            <input name="name" defaultValue={settings.name} required className={`mt-1 ${fieldClass}`} />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Tagline
            <input
              name="tagline"
              defaultValue={settings.tagline ?? ""}
              placeholder="Official merch and digital downloads"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Support email
            <input
              name="supportEmail"
              type="email"
              defaultValue={settings.supportEmail ?? ""}
              placeholder="shop@triforgemedia.com"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Currency
            <input
              name="currency"
              defaultValue={settings.currency}
              required
              maxLength={3}
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Shipping countries (physical)
            <input
              name="shippingCountries"
              defaultValue={settings.shippingCountries}
              placeholder="US,CA,GB,AU"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <p className="font-body text-xs text-off-white/35">
            Two-letter codes, comma-separated. Digital products skip shipping.
          </p>
          <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={settings.isPublished}
              className="h-4 w-4 accent-orange"
            />
            Publish shop to members
          </label>
        </section>

        <section className="glass flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Stripe</h2>
          <p className="font-body text-xs text-off-white/45">
            From{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
              className="text-cyan hover:underline"
            >
              Stripe → Developers → API keys
            </a>
            . Prefer a restricted key (rk_). Leave a field blank to keep the saved value. Keys saved
            here override Railway env.
          </p>
          <CopyField label="Webhook endpoint" value={webhookUrl} />
          <p className="font-body text-xs text-off-white/35">
            Stripe → Developers → Webhooks → Add endpoint. Events:{" "}
            <span className="text-off-white/60">
              checkout.session.completed, checkout.session.async_payment_succeeded,
              checkout.session.async_payment_failed
            </span>
            . Then paste the signing secret below.
          </p>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Publishable key (pk_)
            <input
              name="stripePublishableKey"
              placeholder={
                settings.stripePublishableKey || stripe.publishableKey
                  ? "Saved — paste a new key to replace"
                  : "pk_test_…"
              }
              autoComplete="off"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Secret key (sk_ or rk_)
            <input
              name="stripeSecretKey"
              type="password"
              placeholder={
                stripe.hasSecret
                  ? `Saved from ${stripe.secretSource === "settings" ? "this page" : "Railway env"} — paste to replace`
                  : "sk_test_… or rk_test_…"
              }
              autoComplete="new-password"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Webhook signing secret (whsec_)
            <input
              name="stripeWebhookSecret"
              type="password"
              placeholder={
                stripe.hasWebhook
                  ? `Saved from ${stripe.webhookSource === "settings" ? "this page" : "Railway env"} — paste to replace`
                  : "whsec_…"
              }
              autoComplete="new-password"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <p className="font-body text-xs text-off-white/35">
            For US/EU sales, add a Stripe Tax registration in the Dashboard. The hub does not turn
            tax on until that exists.
          </p>
        </section>

        <section className="glass flex flex-col gap-3 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">Later connections</h2>
          <p className="font-body text-xs text-off-white/40">
            Optional IDs you can save now. Import and Printify attach are not wired yet.
          </p>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Shopify store domain
            <input
              name="shopifyShopDomain"
              defaultValue={settings.shopifyShopDomain ?? ""}
              placeholder="your-store.myshopify.com"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Printify shop ID
            <input
              name="printifyShopId"
              defaultValue={settings.printifyShopId ?? ""}
              placeholder="Printify shop id"
              className={`mt-1 ${fieldClass}`}
            />
          </label>
        </section>

        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Save shop settings
        </button>
      </form>
    </main>
  );
}

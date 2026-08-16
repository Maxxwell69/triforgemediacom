import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/session";
import {
  formatPriceCents,
  getPublishedProductBySlug,
  requireShopModule,
} from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";
import { isStripeConfigured } from "@/lib/shop/stripe";
import ShopBuyForm from "@/components/shop/ShopBuyForm";

export const dynamic = "force-dynamic";

export default async function ShopProductPage({ params }: { params: { slug: string } }) {
  requireShopModule();
  await requireProfile();
  const settings = await getOrCreateShopSettings();
  if (!settings.isPublished) notFound();

  const product = await getPublishedProductBySlug(params.slug);
  if (!product) notFound();

  const price = product.variants[0]?.priceCents;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop" className="font-body text-sm text-off-white/50 transition hover:text-cyan">
          ← Shop
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {product.images.length === 0 ? (
              <div className="glass flex aspect-square items-center justify-center rounded-2xl font-body text-off-white/30">
                No image
              </div>
            ) : (
              product.images.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-2xl border border-off-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={product.title} className="w-full object-cover" />
                </div>
              ))
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl tracking-wide text-off-white">{product.title}</h1>
            {price != null ? (
              <p className="mt-3 font-display text-3xl text-gradient">
                {formatPriceCents(price, settings.currency)}
              </p>
            ) : null}
            {product.description ? (
              <p className="mt-4 whitespace-pre-wrap font-body text-sm text-off-white/65">
                {product.description}
              </p>
            ) : null}

            <p className="mt-2 font-body text-xs uppercase tracking-wide text-off-white/40">
              {product.kind === "DIGITAL" ? "Digital download" : "Physical"}
            </p>

            <ShopBuyForm
              kind={product.kind}
              currency={settings.currency}
              checkoutReady={isStripeConfigured()}
              digitalReady={product.kind === "PHYSICAL" || product.files.length > 0}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                title: variant.title,
                priceCents: variant.priceCents,
                inventory: variant.inventory,
              }))}
            />
            <p className="mt-2 font-body text-xs text-off-white/35">
              {product.kind === "DIGITAL"
                ? "After payment, files appear under Shop → Downloads."
                : "Shipping address is collected on Stripe Checkout."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

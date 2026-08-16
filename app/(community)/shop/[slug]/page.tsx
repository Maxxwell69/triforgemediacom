import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProfile } from "@/lib/session";
import {
  formatPriceCents,
  getPublishedProductBySlug,
  requireShopModule,
} from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";

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

            {product.variants.length > 1 ? (
              <div className="mt-6">
                <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
                  Options
                </p>
                <ul className="mt-2 flex flex-col gap-2">
                  {product.variants.map((variant) => (
                    <li
                      key={variant.id}
                      className="flex items-center justify-between rounded-xl border border-off-white/10 px-4 py-2 font-body text-sm"
                    >
                      <span className="text-off-white">{variant.title}</span>
                      <span className="text-cyan">
                        {formatPriceCents(variant.priceCents, settings.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              disabled
              className="mt-8 w-full cursor-not-allowed rounded-lg bg-orange/40 px-6 py-3 font-body font-semibold text-off-white/70"
            >
              Checkout coming soon
            </button>
            <p className="mt-2 font-body text-xs text-off-white/35">
              Stripe Checkout will take payment on the hub. You can browse for now.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

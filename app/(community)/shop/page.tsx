import Link from "next/link";
import { requireProfile } from "@/lib/session";
import {
  formatPriceCents,
  listPublishedProducts,
  requireShopModule,
} from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  requireShopModule();
  await requireProfile();
  const [settings, products] = await Promise.all([
    getOrCreateShopSettings(),
    listPublishedProducts(),
  ]);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">SHOP</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Official merch for the network. Checkout is coming next — browse the catalog now.
        </p>

        {!settings.isPublished ? (
          <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
            The shop is not published yet. Check back soon.
          </p>
        ) : products.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
            No products listed yet.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const image = product.images[0];
              const price = product.variants[0]?.priceCents;
              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="glass flex h-full flex-col gap-3 rounded-2xl p-5 transition hover:border-cyan/40"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-off-white/5">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt={product.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center font-body text-off-white/30">
                        No image
                      </span>
                    )}
                  </div>
                  <p className="font-body font-semibold text-off-white">{product.title}</p>
                  {product.description ? (
                    <p className="line-clamp-2 font-body text-sm text-off-white/50">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="mt-auto font-body text-sm font-semibold text-cyan">
                    {price != null ? formatPriceCents(price, settings.currency) : "—"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

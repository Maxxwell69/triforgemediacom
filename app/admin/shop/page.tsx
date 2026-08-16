import Link from "next/link";
import { requireShopModule, listAdminProducts } from "@/lib/shop/catalog";
import { createProduct } from "./actions";
import ShopProductRow from "@/components/admin/ShopProductRow";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminShopPage() {
  requireShopModule();
  const products = await listAdminProducts();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            SHOP <span className="text-gradient">PRODUCTS</span>
          </h1>
          <p className="mt-2 font-body text-off-white/60">
            Native catalog for Hub merch. Shopify import, Printify, and Stripe checkout come next.
          </p>
        </div>
        <div className="flex gap-2 font-body text-sm">
          <Link href="/admin/shop/orders" className="text-off-white/50 transition hover:text-cyan">
            Orders
          </Link>
          <span className="text-off-white/20">·</span>
          <Link href="/admin/shop/settings" className="text-off-white/50 transition hover:text-cyan">
            Settings
          </Link>
        </div>
      </div>

      <form action={createProduct} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New product</h2>
        <input name="title" required placeholder="e.g. TriForge Hoodie" className={fieldClass} />
        <input name="slug" placeholder="URL slug (optional)" className={fieldClass} />
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <ImageUploadField name="imageUrl" folder="shop-images" label="Image" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Price (USD)"
            className={fieldClass}
          />
          <select name="status" defaultValue="DRAFT" className={fieldClass}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Add product
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {products.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No products yet — add the first one above.
          </p>
        ) : (
          products.map((product) => (
            <ShopProductRow
              key={product.id}
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                status: product.status,
                imageUrl: product.images[0]?.url ?? null,
                priceCents: product.variants[0]?.priceCents ?? null,
                variantCount: product._count.variants,
              }}
            />
          ))
        )}
      </div>
    </main>
  );
}

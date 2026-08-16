import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireShopModule } from "@/lib/shop/catalog";
import { addProductImage, addVariant, updateProduct } from "../actions";
import ImageUploadField from "@/components/ImageUploadField";
import ShopImageRemoveButton from "@/components/admin/ShopImageRemoveButton";
import ShopVariantRow from "@/components/admin/ShopVariantRow";
import ShopArchiveButton from "@/components/admin/ShopArchiveButton";
import ShopFileUpload from "@/components/admin/ShopFileUpload";
import ShopFileRemoveButton from "@/components/admin/ShopFileRemoveButton";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminShopProductPage({
  params,
}: {
  params: { productId: string };
}) {
  requireShopModule();
  const product = await prisma.shopProduct.findUnique({
    where: { id: params.productId },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      files: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/shop"
        className="font-body text-sm text-off-white/50 transition hover:text-cyan"
      >
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        EDIT <span className="text-gradient">PRODUCT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/50">
        Source: {product.source}
        {product.externalId ? ` · ${product.externalId}` : ""}
      </p>

      <form action={updateProduct} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <input type="hidden" name="id" value={product.id} />
        <input name="title" defaultValue={product.title} required className={fieldClass} />
        <input name="slug" defaultValue={product.slug} className={fieldClass} />
        <textarea
          name="description"
          defaultValue={product.description ?? ""}
          rows={4}
          className={fieldClass}
        />
        <select name="kind" defaultValue={product.kind} className={fieldClass}>
          <option value="PHYSICAL">Physical</option>
          <option value="DIGITAL">Digital download</option>
        </select>
        <select name="status" defaultValue={product.status} className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Save product
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Images</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {product.images.map((image) => (
            <div key={image.id} className="glass overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="aspect-square w-full object-cover" />
              <div className="px-3 py-2">
                <ShopImageRemoveButton imageId={image.id} />
              </div>
            </div>
          ))}
        </div>
        <form action={addProductImage} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          <input type="hidden" name="productId" value={product.id} />
          <ImageUploadField name="imageUrl" folder="shop-images" label="Add image" />
          <button
            type="submit"
            className="self-start rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10"
          >
            Add image
          </button>
        </form>
      </section>

      {product.kind === "DIGITAL" ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">Download files</h2>
          <p className="mt-1 font-body text-xs text-off-white/40">
            Buyers get these after Stripe payment. Files stay private.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {product.files.map((file) => (
              <li
                key={file.id}
                className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-3 font-body text-sm"
              >
                <span className="text-off-white">{file.fileName}</span>
                <ShopFileRemoveButton fileId={file.id} />
              </li>
            ))}
          </ul>
          <div className="glass mt-4 rounded-2xl p-6">
            <ShopFileUpload productId={product.id} />
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Variants</h2>
        <p className="mt-1 font-body text-xs text-off-white/40">
          Stripe and Shopify/Printify sync will attach to these rows later.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {product.variants.map((variant) => (
            <ShopVariantRow
              key={variant.id}
              canDelete={product.variants.length > 1}
              variant={{
                id: variant.id,
                title: variant.title,
                sku: variant.sku,
                priceCents: variant.priceCents,
                inventory: variant.inventory,
              }}
            />
          ))}
        </div>
        <form action={addVariant} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          <h3 className="font-display text-lg tracking-wide text-off-white/80">Add variant</h3>
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="e.g. Large / Black" className={fieldClass} />
            <input name="sku" placeholder="SKU (optional)" className={fieldClass} />
          </div>
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
            <input
              name="inventory"
              type="number"
              min={0}
              placeholder="Inventory (blank = unlimited)"
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10"
          >
            Add variant
          </button>
        </form>
      </section>

      {product.status !== "ARCHIVED" ? (
        <div className="mt-10">
          <ShopArchiveButton productId={product.id} />
        </div>
      ) : null}
    </main>
  );
}

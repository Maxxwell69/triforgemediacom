"use client";

import { useTransition } from "react";
import Link from "next/link";
import { setProductStatus } from "@/app/admin/shop/actions";
import { formatPriceCents } from "@/lib/shop/price";

type Product = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  imageUrl: string | null;
  priceCents: number | null;
  variantCount: number;
};

const STATUS_STYLES: Record<Product["status"], string> = {
  DRAFT: "bg-off-white/10 text-off-white/50",
  ACTIVE: "bg-cyan/15 text-cyan",
  ARCHIVED: "bg-off-white/10 text-off-white/35",
};

export default function ShopProductRow({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={`glass flex items-center justify-between gap-4 rounded-xl p-4 ${
        product.status !== "ACTIVE" ? "opacity-70" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-off-white/5">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center font-body text-xs text-off-white/30">
              —
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-medium text-off-white">{product.title}</p>
          <p className="truncate font-body text-xs text-off-white/40">
            {product.priceCents != null ? formatPriceCents(product.priceCents) : "No price"}
            {" \u00b7 "}
            {product.variantCount} variant{product.variantCount === 1 ? "" : "s"}
            {" \u00b7 "}/{product.slug}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 font-body text-[11px] uppercase tracking-wide ${STATUS_STYLES[product.status]}`}
        >
          {product.status}
        </span>
        {product.status !== "ACTIVE" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setProductStatus(product.id, "ACTIVE"))}
            className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
          >
            Publish
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setProductStatus(product.id, "DRAFT"))}
            className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-orange/40 hover:text-orange disabled:opacity-40"
          >
            Unpublish
          </button>
        )}
        <Link
          href={`/admin/shop/${product.id}`}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

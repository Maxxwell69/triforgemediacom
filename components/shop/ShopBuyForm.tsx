"use client";

import { useState } from "react";
import { startShopCheckout } from "@/app/(community)/shop/actions";
import { formatPriceCents } from "@/lib/shop/price";

type Variant = {
  id: string;
  title: string;
  priceCents: number;
  inventory: number | null;
};

export default function ShopBuyForm({
  variants,
  currency,
  checkoutReady,
  digitalReady,
  kind,
}: {
  variants: Variant[];
  currency: string;
  checkoutReady: boolean;
  digitalReady: boolean;
  kind: "PHYSICAL" | "DIGITAL";
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const selected = variants.find((v) => v.id === variantId) ?? variants[0];
  const soldOut = selected?.inventory === 0;
  const disabled = !checkoutReady || !digitalReady || soldOut || !selected;

  return (
    <form action={startShopCheckout} className="mt-8 flex flex-col gap-3">
      {variants.length > 1 ? (
        <label className="font-body text-sm text-off-white/70">
          Option
          <select
            name="variantId"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 text-off-white outline-none focus:border-cyan/60"
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} — {formatPriceCents(variant.priceCents, currency)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="variantId" value={variantId} />
      )}
      {kind === "PHYSICAL" ? (
        <label className="font-body text-sm text-off-white/70">
          Quantity
          <input
            name="quantity"
            type="number"
            min={1}
            max={20}
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 text-off-white outline-none focus:border-cyan/60"
          />
        </label>
      ) : (
        <input type="hidden" name="quantity" value="1" />
      )}
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-orange px-6 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-orange/40 disabled:shadow-none"
      >
        {!checkoutReady
          ? "Checkout not configured"
          : !digitalReady
            ? "Download not ready"
            : soldOut
              ? "Sold out"
              : kind === "DIGITAL"
                ? "Buy and download"
                : "Checkout"}
      </button>
    </form>
  );
}

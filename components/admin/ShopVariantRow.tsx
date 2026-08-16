"use client";

import { useTransition } from "react";
import { deleteVariant, updateVariant } from "@/app/admin/shop/actions";
import { centsToDollarInput } from "@/lib/shop/price";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type Variant = {
  id: string;
  title: string;
  sku: string | null;
  priceCents: number;
  inventory: number | null;
};

export default function ShopVariantRow({
  variant,
  canDelete,
}: {
  variant: Variant;
  canDelete: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form action={updateVariant} className="glass flex flex-col gap-3 rounded-xl p-4">
      <input type="hidden" name="id" value={variant.id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="title" defaultValue={variant.title} required className={fieldClass} />
        <input
          name="sku"
          defaultValue={variant.sku ?? ""}
          placeholder="SKU (optional)"
          className={fieldClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={centsToDollarInput(variant.priceCents)}
          required
          placeholder="Price (USD)"
          className={fieldClass}
        />
        <input
          name="inventory"
          type="number"
          min={0}
          defaultValue={variant.inventory ?? ""}
          placeholder="Inventory (blank = unlimited)"
          className={fieldClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
        >
          Save variant
        </button>
        {canDelete ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteVariant(variant.id))}
            className="font-body text-sm text-off-white/40 transition hover:text-orange disabled:opacity-40"
          >
            {isPending ? "Removing…" : "Remove"}
          </button>
        ) : (
          <p className="font-body text-xs text-off-white/35">At least one variant is required</p>
        )}
      </div>
    </form>
  );
}

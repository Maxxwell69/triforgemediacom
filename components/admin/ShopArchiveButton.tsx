"use client";

import { useTransition } from "react";
import { setProductStatus } from "@/app/admin/shop/actions";

export default function ShopArchiveButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setProductStatus(productId, "ARCHIVED"))}
      className="font-body text-sm text-off-white/40 transition hover:text-orange disabled:opacity-40"
    >
      {isPending ? "Archiving…" : "Archive this product"}
    </button>
  );
}

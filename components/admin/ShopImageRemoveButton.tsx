"use client";

import { useTransition } from "react";
import { removeProductImage } from "@/app/admin/shop/actions";

export default function ShopImageRemoveButton({ imageId }: { imageId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => removeProductImage(imageId))}
      className="font-body text-xs text-off-white/40 transition hover:text-orange disabled:opacity-40"
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}

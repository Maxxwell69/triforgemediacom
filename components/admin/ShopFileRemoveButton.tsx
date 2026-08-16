"use client";

import { useTransition } from "react";
import { removeProductFile } from "@/app/admin/shop/actions";

export default function ShopFileRemoveButton({ fileId }: { fileId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => removeProductFile(fileId))}
      className="font-body text-xs text-off-white/40 transition hover:text-orange disabled:opacity-40"
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { markOrderFulfilled } from "@/app/admin/shop/actions";

export default function ShopFulfillButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => markOrderFulfilled(orderId))}
      className="rounded-lg border border-cyan/40 px-3 py-1 font-body text-xs text-cyan transition hover:bg-cyan/10 disabled:opacity-40"
    >
      {isPending ? "Saving…" : "Mark fulfilled"}
    </button>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { formatPriceCents, requireShopModule } from "@/lib/shop/catalog";
import { syncPaidCheckout } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-off-white/45",
  PAID: "text-cyan",
  FULFILLING: "text-orange",
  FULFILLED: "text-cyan",
  CANCELLED: "text-off-white/35",
  REFUNDED: "text-off-white/35",
};

export default async function ShopOrdersPage({
  searchParams,
}: {
  searchParams?: { paid?: string; session_id?: string };
}) {
  requireShopModule();
  const { user } = await requireProfile();
  if (searchParams?.session_id) {
    await syncPaidCheckout(searchParams.session_id);
  }

  const orders = await prisma.shopOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/shop" className="font-body text-sm text-off-white/50 transition hover:text-cyan">
          ← Shop
        </Link>
        <h1 className="mt-4 font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">ORDERS</span>
        </h1>
        {searchParams?.paid ? (
          <p className="mt-3 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-2 font-body text-sm text-cyan">
            Payment received. Digital files are in{" "}
            <Link href="/shop/downloads" className="underline">
              Downloads
            </Link>
            .
          </p>
        ) : null}

        {orders.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
            No orders yet.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-body text-sm text-off-white/50">
                    {order.createdAt.toLocaleString()}
                  </p>
                  <p className={`font-body text-xs uppercase tracking-wide ${STATUS_STYLES[order.status] ?? ""}`}>
                    {order.status}
                  </p>
                </div>
                <ul className="mt-3 font-body text-sm text-off-white">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.title}
                      {item.variantTitle !== "Default" ? ` — ${item.variantTitle}` : ""} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-body text-sm text-cyan">
                  {formatPriceCents(order.totalCents, order.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

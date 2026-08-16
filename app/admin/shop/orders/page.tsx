import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireShopModule, formatPriceCents } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-off-white/10 text-off-white/50",
  PAID: "bg-cyan/15 text-cyan",
  FULFILLING: "bg-orange/15 text-orange",
  FULFILLED: "bg-cyan/15 text-cyan",
  CANCELLED: "bg-off-white/10 text-off-white/35",
  REFUNDED: "bg-off-white/10 text-off-white/35",
};

export default async function AdminShopOrdersPage() {
  requireShopModule();
  const orders = await prisma.shopOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      items: { select: { id: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/admin/shop"
        className="font-body text-sm text-off-white/50 transition hover:text-cyan"
      >
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        SHOP <span className="text-gradient">ORDERS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Ready for Stripe Checkout. Members cannot place orders until checkout is wired.
      </p>

      {orders.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
          No orders yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-off-white/10">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-off-white/10 text-xs uppercase tracking-wide text-off-white/40">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-off-white/5 last:border-0">
                  <td className="px-3 py-2 text-off-white/70">
                    {order.createdAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-off-white">
                    {order.user.name || order.user.email}
                  </td>
                  <td className="px-3 py-2 text-off-white/60">{order.items.length}</td>
                  <td className="px-3 py-2 text-off-white">
                    {formatPriceCents(order.totalCents, order.currency)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${STATUS_STYLES[order.status] ?? ""}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

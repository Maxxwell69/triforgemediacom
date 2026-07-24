import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [pendingCount, userCount] = await Promise.all([
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        ADMIN <span className="text-gradient">DASHBOARD</span>
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/applications"
          className="glass rounded-2xl p-6 transition hover:border-cyan/40"
        >
          <p className="font-body text-sm text-off-white/50">Pending applications</p>
          <p className="mt-2 font-display text-4xl text-gradient">{pendingCount}</p>
        </Link>

        <div className="glass rounded-2xl p-6">
          <p className="font-body text-sm text-off-white/50">Active members</p>
          <p className="mt-2 font-display text-4xl">{userCount}</p>
        </div>
      </div>
    </main>
  );
}

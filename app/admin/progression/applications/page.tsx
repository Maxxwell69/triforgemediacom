import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";
import ProgressionApplicationsPanel from "@/components/admin/ProgressionApplicationsPanel";

export const dynamic = "force-dynamic";

export default async function AdminProgressionApplicationsPage() {
  requireProgressionModule();
  const [pending, recent] = await Promise.all([
    prisma.progressionApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.progressionApplication.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        PROGRESSION <span className="text-gradient">APPLICATIONS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Media Network members apply on /progress. Approve to add them as a Recruit.
      </p>
      <ProgressionAdminNav />
      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Pending</h2>
        <div className="mt-4">
          <ProgressionApplicationsPanel applications={pending} />
        </div>
      </section>
      {recent.length > 0 ? (
        <section className="glass mt-4 rounded-2xl p-6">
          <h2 className="font-display text-xl text-off-white/80">Recent decisions</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {recent.map((app) => (
              <li key={app.id} className="font-body text-sm text-off-white/65">
                {app.user.name || app.user.email} · {app.status.toLowerCase()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

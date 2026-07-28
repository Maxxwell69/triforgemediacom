import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GhlImportPanel from "@/components/admin/GhlImportPanel";
import GhlImportRowActions from "@/components/admin/GhlImportRowActions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-off-white/10 text-off-white/50",
  INVITED: "bg-orange/15 text-orange",
  CONFIRMED: "bg-cyan/15 text-cyan",
  DECLINED: "bg-off-white/10 text-off-white/40",
};

export default async function AdminImportPage() {
  const imports = await prisma.ghlImport.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, status: true } } },
  });

  const counts = {
    invited: imports.filter((i) => i.status === "INVITED").length,
    confirmed: imports.filter((i) => i.status === "CONFIRMED").length,
    declined: imports.filter((i) => i.status === "DECLINED").length,
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        IM<span className="text-gradient">PORT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Bring existing GoHighLevel contacts (Media + Creator Network signups) into the Hub as
        real accounts, from a CSV export. Course/lesson content is migrated manually with the
        course builder instead.
      </p>

      <div className="mt-8">
        <GhlImportPanel />
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">
            Holding pattern &middot; {imports.length} imported total
          </h2>
          <p className="font-body text-xs text-off-white/40">
            {counts.invited} awaiting response &middot; {counts.confirmed} confirmed &middot;{" "}
            {counts.declined} declined
          </p>
        </div>

        {imports.length === 0 ? (
          <p className="mt-4 font-body text-off-white/50">
            No contacts imported yet — search GHL by tag above to get started.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-off-white/10">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-off-white/10 text-xs uppercase tracking-wide text-off-white/40">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Invited</th>
                  <th className="px-3 py-2">Responded</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((i) => (
                  <tr key={i.id} className="border-b border-off-white/5 last:border-0">
                    <td className="px-3 py-2 text-off-white">
                      {i.user ? (
                        <Link
                          href={`/admin/users/${i.user.id}`}
                          className="hover:text-cyan hover:underline"
                        >
                          {i.name || "Unnamed"}
                        </Link>
                      ) : (
                        i.name || "Unnamed"
                      )}
                    </td>
                    <td className="px-3 py-2 text-off-white/70">{i.email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[i.status]}`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-off-white/40">
                      {i.invitedAt ? i.invitedAt.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-off-white/40">
                      {i.respondedAt ? i.respondedAt.toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <GhlImportRowActions ghlImportId={i.id} status={i.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

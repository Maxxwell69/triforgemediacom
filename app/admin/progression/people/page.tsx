import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import ProgressionAdminNav from "@/components/admin/ProgressionAdminNav";

export const dynamic = "force-dynamic";

export default async function AdminProgressionPeoplePage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  requireProgressionModule();
  const q = searchParams?.q?.trim() || "";
  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      hiddenFromDirectory: false,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    take: 40,
    orderBy: { name: "asc" },
    include: {
      progressionProfile: { include: { currentLevel: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CREATOR <span className="text-gradient">TREES</span>
      </h1>
      <ProgressionAdminNav />
      <form className="mt-8">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60"
        />
      </form>
      <div className="mt-4 flex flex-col gap-2">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/admin/progression/people/${user.id}`}
            className="glass flex items-center justify-between rounded-xl p-4 hover:border-cyan/40"
          >
            <div>
              <p className="font-body text-sm text-off-white">{user.name || user.email}</p>
              <p className="font-body text-xs text-off-white/40">{user.email}</p>
            </div>
            <p className="font-body text-xs text-cyan">
              {user.progressionProfile?.enrolledAt
                ? user.progressionProfile.currentLevel?.name || "Recruit"
                : "Not enrolled"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

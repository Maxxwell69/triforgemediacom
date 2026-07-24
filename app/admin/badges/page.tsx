import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  const badges = await prisma.badge.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { userBadges: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        ALL <span className="text-gradient">BADGES</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Badges are managed from each course&apos;s detail page. This is a read-only overview.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {badges.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No badges yet. Add one from a course&apos;s detail page.
          </p>
        )}
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="glass flex items-center justify-between gap-4 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{badge.icon || "🏆"}</span>
              <div>
                <p className="font-body text-sm font-medium text-off-white">{badge.name}</p>
                <p className="mt-0.5 font-body text-xs text-off-white/40">
                  {badge._count.userBadges} member
                  {badge._count.userBadges === 1 ? "" : "s"} earned this
                  {badge.course && (
                    <>
                      {" \u00b7 "}
                      {badge.course.title}
                    </>
                  )}
                </p>
              </div>
            </div>
            {badge.course && (
              <Link
                href={`/admin/courses/${badge.course.id}`}
                className="shrink-0 rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
              >
                Manage
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

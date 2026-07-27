import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createStandaloneBadge } from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

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
        Course-linked badges are managed from each course&apos;s detail page. Standalone badges
        (below) can be awarded to anyone from the Users page, independent of any course.
      </p>

      <form
        key={badges.length}
        action={createStandaloneBadge}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">
          New standalone badge
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" required placeholder="e.g. MVP, Early Supporter" className={fieldClass} />
          <input
            name="icon"
            type="text"
            placeholder="🏆"
            maxLength={10}
            className={`${fieldClass} sm:w-24`}
          />
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create badge
        </button>
      </form>

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

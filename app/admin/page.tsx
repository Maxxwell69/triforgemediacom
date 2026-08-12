import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_NAV_SECTIONS } from "@/lib/adminNav";
import { liveNotStaleWhere } from "@/lib/tiktokLive";
import { setAnnouncement, clearAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminDashboardPage() {
  const [pendingCount, userCount, liveCount, networkCount, announcement] = await Promise.all([
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.tikTokStatsSnapshot.count({ where: liveNotStaleWhere() }),
    prisma.user.count({
      where: {
        status: "ACTIVE",
        hiddenFromDirectory: false,
        OR: [
          { tags: { some: { tag: { name: { equals: "CN", mode: "insensitive" } } } } },
          { tags: { some: { tag: { name: { equals: "MN", mode: "insensitive" } } } } },
          { groupMemberships: { some: { group: { name: { equals: "CN", mode: "insensitive" } } } } },
          { groupMemberships: { some: { group: { name: { equals: "MN", mode: "insensitive" } } } } },
        ],
      },
    }),
    prisma.announcement.findUnique({ where: { id: "global" } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        ADMIN <span className="text-gradient">DASHBOARD</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Jump into any admin area — sections match the nav dropdowns above.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/applications"
          className="glass rounded-2xl p-6 transition hover:border-cyan/40"
        >
          <p className="font-body text-sm text-off-white/50">Pending applicants</p>
          <p className="mt-2 font-display text-4xl text-gradient">{pendingCount}</p>
        </Link>
        <Link
          href="/admin/users"
          className="glass rounded-2xl p-6 transition hover:border-cyan/40"
        >
          <p className="font-body text-sm text-off-white/50">Active members</p>
          <p className="mt-2 font-display text-4xl">{userCount}</p>
        </Link>
        <Link
          href="/admin/network"
          className="glass rounded-2xl p-6 transition hover:border-cyan/40"
        >
          <p className="font-body text-sm text-off-white/50">Network creators</p>
          <p className="mt-2 font-display text-4xl text-cyan">{networkCount}</p>
        </Link>
        <Link
          href="/live"
          className="glass rounded-2xl p-6 transition hover:border-orange/40"
        >
          <p className="font-body text-sm text-off-white/50">Live on TikTok</p>
          <p className="mt-2 font-display text-4xl text-orange">{liveCount}</p>
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">
          Admin areas
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg tracking-wide text-off-white">
                {section.label}
              </h3>
              <p className="mt-1 font-body text-xs text-off-white/45">{section.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={link.description}
                    className="rounded-lg border border-off-white/15 bg-off-white/[0.03] px-3 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">
          Company announcement
        </h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Shows as a banner at the top of every member&apos;s dashboard until you clear it.
        </p>

        <form action={setAnnouncement} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          {announcement?.isActive && (
            <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-body text-xs text-cyan">
              Currently live
              {announcement.updatedByName ? ` — last set by ${announcement.updatedByName}` : ""}
              {" \u00b7 "}
              {announcement.updatedAt.toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          <textarea
            name="message"
            required
            defaultValue={announcement?.message ?? ""}
            rows={2}
            placeholder="e.g. Server maintenance tonight at 10pm EST — chat will be briefly unavailable."
            className={fieldClass}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
            >
              {announcement?.isActive ? "Update announcement" : "Post announcement"}
            </button>
            {announcement?.isActive && (
              <button
                formAction={clearAnnouncement}
                className="font-body text-sm text-off-white/50 transition hover:text-orange"
              >
                Clear (hide banner)
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

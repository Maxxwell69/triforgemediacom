import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { requireSupportModule, getSupportTicketUnreadCount } from "@/lib/supportReads";

export const dynamic = "force-dynamic";

export default async function SupportHomePage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  requireSupportModule();
  const { user } = await requireProfile();
  const q = searchParams?.q?.trim() || "";

  const [categories, featured, matches, openCount, needsAttention] = await Promise.all([
    prisma.faqCategory.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        articles: {
          where: { published: true },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: { id: true, title: true, slug: true },
        },
      },
    }),
    q
      ? Promise.resolve([])
      : prisma.faqArticle.findMany({
          where: { published: true, featured: true, category: { published: true } },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          take: 6,
          select: { id: true, title: true, slug: true, body: true },
        }),
    q
      ? prisma.faqArticle.findMany({
          where: {
            published: true,
            category: { published: true },
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          take: 30,
          select: {
            id: true,
            title: true,
            slug: true,
            body: true,
            category: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    prisma.supportTicket.count({
      where: {
        requesterId: user.id,
        status: { in: ["OPEN", "WAITING_ON_MEMBER", "WAITING_ON_STAFF"] },
      },
    }),
    getSupportTicketUnreadCount(user.id, user.role),
  ]);

  const visibleCategories = categories.filter((c) => c.articles.length > 0);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          HUB <span className="text-gradient">SUPPORT</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Search the FAQ, or open a ticket. We&apos;ll email you to come back here — don&apos;t
          reply by email.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/support/tickets"
            className="rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            My tickets{openCount > 0 ? ` (${openCount})` : ""}
          </Link>
          <Link
            href="/support/tickets#new"
            className="rounded-lg border border-off-white/20 px-5 py-2.5 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
          >
            Open a ticket
          </Link>
          {needsAttention > 0 && (
            <span className="self-center font-body text-xs text-cyan">
              {needsAttention} need{needsAttention === 1 ? "s" : ""} your attention
            </span>
          )}
        </div>

        <form action="/support" className="mt-8">
          <label className="sr-only" htmlFor="support-faq-q">
            Search FAQ
          </label>
          <div className="flex gap-2">
            <input
              id="support-faq-q"
              name="q"
              defaultValue={q}
              placeholder="Search help articles…"
              className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
            >
              Search
            </button>
          </div>
        </form>

        {q ? (
          <section className="mt-8">
            <h2 className="font-display text-2xl tracking-wide text-off-white/80">
              Results for &ldquo;{q}&rdquo;
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {matches.length === 0 && (
                <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
                  No articles matched.{" "}
                  <Link href="/support/tickets#new" className="text-cyan hover:underline">
                    Open a ticket
                  </Link>
                  .
                </p>
              )}
              {matches.map((article) => (
                <Link
                  key={article.id}
                  href={`/support/faq/${article.slug}`}
                  className="glass rounded-2xl p-5 transition hover:border-cyan/40"
                >
                  <p className="font-body text-xs uppercase tracking-wide text-off-white/40">
                    {article.category.name}
                  </p>
                  <h3 className="mt-1 font-display text-xl tracking-wide">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 font-body text-sm text-off-white/55">
                    {article.body.slice(0, 180)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-2xl tracking-wide text-off-white/80">
                  Featured
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {featured.map((article) => (
                    <Link
                      key={article.id}
                      href={`/support/faq/${article.slug}`}
                      className="glass rounded-2xl p-5 transition hover:border-cyan/40"
                    >
                      <h3 className="font-display text-xl tracking-wide">{article.title}</h3>
                      <p className="mt-2 line-clamp-3 font-body text-sm text-off-white/55">
                        {article.body.slice(0, 180)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-2xl tracking-wide text-off-white/80">FAQ</h2>
              {visibleCategories.length === 0 && (
                <p className="glass mt-4 rounded-2xl p-8 text-center font-body text-off-white/50">
                  Help articles will show up here. In the meantime,{" "}
                  <Link href="/support/tickets#new" className="text-cyan hover:underline">
                    open a ticket
                  </Link>
                  .
                </p>
              )}
              <div className="mt-4 flex flex-col gap-6">
                {visibleCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="font-display text-lg tracking-wide text-cyan">
                      {category.name}
                    </h3>
                    <ul className="mt-2 flex flex-col gap-1">
                      {category.articles.map((article) => (
                        <li key={article.id}>
                          <Link
                            href={`/support/faq/${article.slug}`}
                            className="font-body text-sm text-off-white/75 hover:text-cyan"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

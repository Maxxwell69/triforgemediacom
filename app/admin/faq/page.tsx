import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { ensureDefaultFaqCategories } from "@/lib/faq";
import { requireSupportModule } from "@/lib/supportReads";
import {
  createFaqArticleAction,
  createFaqCategoryAction,
  deleteFaqCategoryAction,
  updateFaqCategoryAction,
} from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  requireSupportModule();
  await requireAdminPage();
  await ensureDefaultFaqCategories();

  const categories = await prisma.faqCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      articles: {
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          published: true,
          featured: true,
          slug: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        SUPPORT <span className="text-gradient">FAQ</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Articles members see at{" "}
        <Link href="/support" className="text-cyan hover:underline">
          /support
        </Link>
        . Tickets are in the{" "}
        <Link href="/admin/support" className="text-cyan hover:underline">
          support queue
        </Link>
        .
      </p>
      {searchParams?.error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {searchParams.error}
        </p>
      )}

      <form action={createFaqCategoryAction} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New category</h2>
        <input name="name" required minLength={2} maxLength={80} placeholder="Category name" className={fieldClass} />
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={categories.length} className={fieldClass} />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="published"
            defaultChecked
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Published
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create category
        </button>
      </form>

      <form action={createFaqArticleAction} className="glass mt-6 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New article</h2>
        <input name="title" required minLength={3} maxLength={160} placeholder="Article title" className={fieldClass} />
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Category
          <select name="categoryId" required className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <textarea
          name="body"
          required
          minLength={10}
          rows={8}
          placeholder="Article body. Use blank lines between paragraphs. **bold** and [links](https://…) work."
          className={fieldClass}
        />
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={0} className={fieldClass} />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="published"
            defaultChecked
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Published
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="featured"
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Featured on /support
        </label>
        <button
          type="submit"
          disabled={categories.length === 0}
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
        >
          Create article
        </button>
      </form>

      <div className="mt-10 flex flex-col gap-6">
        {categories.map((category) => (
          <section key={category.id} className="glass rounded-2xl p-6">
            <form action={updateFaqCategoryAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={category.id} />
              <div className="grid gap-2 sm:grid-cols-[1fr_5rem]">
                <input name="name" defaultValue={category.name} required className={fieldClass} />
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={category.sortOrder}
                  className={fieldClass}
                />
              </div>
              <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={category.published}
                  className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
                />
                Published
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-lg border border-off-white/20 px-4 py-1.5 font-body text-xs text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
                >
                  Save category
                </button>
              </div>
            </form>
            <form action={deleteFaqCategoryAction} className="mt-2">
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                className="font-body text-xs text-orange/70 underline-offset-2 hover:underline"
              >
                Delete category{category.articles.length > 0 ? " and its articles" : ""}
              </button>
            </form>

            <ul className="mt-4 flex flex-col gap-2">
              {category.articles.length === 0 && (
                <li className="font-body text-sm text-off-white/40">No articles yet.</li>
              )}
              {category.articles.map((article) => (
                <li key={article.id} className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/admin/faq/${article.id}`} className="font-body text-sm text-off-white/80 hover:text-cyan">
                    {article.title}
                    {!article.published ? (
                      <span className="ml-2 text-off-white/35">draft</span>
                    ) : null}
                    {article.featured ? (
                      <span className="ml-2 text-cyan">featured</span>
                    ) : null}
                  </Link>
                  <Link
                    href={`/support/faq/${article.slug}`}
                    className="font-body text-xs text-off-white/40 hover:text-cyan"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

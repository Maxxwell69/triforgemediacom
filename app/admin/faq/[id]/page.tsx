import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { requireSupportModule } from "@/lib/supportReads";
import { deleteFaqArticleAction, updateFaqArticleAction } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminFaqArticlePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { error?: string };
}) {
  requireSupportModule();
  await requireAdminPage();

  const [article, categories] = await Promise.all([
    prisma.faqArticle.findUnique({ where: { id: params.id } }),
    prisma.faqCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/faq" className="font-body text-sm text-cyan hover:underline">
        ← FAQ
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide">Edit article</h1>
      {searchParams?.error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          {searchParams.error}
        </p>
      )}

      <form action={updateFaqArticleAction} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <input type="hidden" name="id" value={article.id} />
        <input name="title" required defaultValue={article.title} className={fieldClass} />
        <label className="flex flex-col gap-1 font-body text-xs text-off-white/50">
          Category
          <select name="categoryId" required defaultValue={article.categoryId} className={fieldClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <textarea name="body" required rows={14} defaultValue={article.body} className={fieldClass} />
        <input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={article.sortOrder}
          className={fieldClass}
        />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="published"
            defaultChecked={article.published}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Published
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={article.featured}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Featured on /support
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Save article
        </button>
      </form>

      <form action={deleteFaqArticleAction} className="mt-4">
        <input type="hidden" name="id" value={article.id} />
        <button
          type="submit"
          className="font-body text-xs text-orange/70 underline-offset-2 hover:underline"
        >
          Delete article
        </button>
      </form>
    </main>
  );
}

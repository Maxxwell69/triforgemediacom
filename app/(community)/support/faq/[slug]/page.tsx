import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { renderFaqBody } from "@/lib/faq";
import { requireSupportModule } from "@/lib/supportReads";

export const dynamic = "force-dynamic";

export default async function FaqArticlePage({ params }: { params: { slug: string } }) {
  requireSupportModule();
  await requireProfile();

  const article = await prisma.faqArticle.findUnique({
    where: { slug: params.slug },
    include: { category: { select: { name: true, published: true } } },
  });

  if (!article || !article.published || !article.category.published) {
    notFound();
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/support" className="font-body text-sm text-cyan hover:underline">
          ← Support
        </Link>
        <p className="mt-6 font-body text-xs uppercase tracking-wide text-off-white/40">
          {article.category.name}
        </p>
        <h1 className="mt-1 font-display text-4xl tracking-wide sm:text-5xl">{article.title}</h1>
        <div
          className="mt-8 font-body text-base leading-relaxed text-off-white/80"
          dangerouslySetInnerHTML={{ __html: renderFaqBody(article.body) }}
        />

        <div className="glass mt-12 rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide">Still need help?</h2>
          <p className="mt-2 font-body text-sm text-off-white/60">
            Open a ticket in the portal. We&apos;ll email you when there&apos;s a reply — answer
            there, not by email.
          </p>
          <Link
            href="/support/tickets#new"
            className="mt-4 inline-block rounded-lg bg-orange px-5 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Open a ticket
          </Link>
        </div>
      </div>
    </main>
  );
}

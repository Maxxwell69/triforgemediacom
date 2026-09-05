import "server-only";

import { prisma } from "@/lib/prisma";
import { escapeHtml } from "@/lib/emailLayout";

export function slugifyFaq(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "article";
}

export async function uniqueFaqCategorySlug(base: string, excludeId?: string): Promise<string> {
  const root = slugifyFaq(base);
  let slug = root;
  let n = 2;
  while (true) {
    const existing = await prisma.faqCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${n}`;
    n += 1;
  }
}

export async function uniqueFaqArticleSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugifyFaq(base);
  let slug = root;
  let n = 2;
  while (true) {
    const existing = await prisma.faqArticle.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${n}`;
    n += 1;
  }
}

const DEFAULT_FAQ_CATEGORIES = [
  { name: "Account", slug: "account" },
  { name: "Membership", slug: "membership" },
  { name: "TikTask & content", slug: "content" },
  { name: "Billing", slug: "billing" },
] as const;

export async function ensureDefaultFaqCategories() {
  const count = await prisma.faqCategory.count();
  if (count > 0) return;

  await prisma.faqCategory.createMany({
    data: DEFAULT_FAQ_CATEGORIES.map((c, i) => ({
      name: c.name,
      slug: c.slug,
      sortOrder: i,
      published: true,
    })),
  });
}

/** Safe FAQ body: escaped text, paragraphs, **bold**, and http(s) links. */
export function renderFaqBody(body: string): string {
  const paragraphs = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p).replace(/\n/g, "<br/>");
      const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const withLinks = withBold.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" class="text-cyan hover:underline" rel="noopener noreferrer" target="_blank">$1</a>'
      );
      return `<p class="mb-4 last:mb-0">${withLinks}</p>`;
    })
    .join("");
}

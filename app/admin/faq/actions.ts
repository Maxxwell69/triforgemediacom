"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";
import { faqArticleSchema, faqCategorySchema } from "@/lib/validations/faq";
import { uniqueFaqArticleSlug, uniqueFaqCategorySlug } from "@/lib/faq";
import { requireSupportModule } from "@/lib/supportReads";

function revalidateFaq() {
  revalidatePath("/admin/faq");
  revalidatePath("/support");
}

export async function createFaqCategoryAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();

  const parsed = faqCategorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    redirect(`/admin/faq?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid category")}`);
  }

  const slug = await uniqueFaqCategorySlug(parsed.data.name);
  await prisma.faqCategory.create({
    data: {
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder ?? 0,
      published: formData.get("published") === "on",
    },
  });

  revalidateFaq();
  redirect("/admin/faq");
}

export async function updateFaqCategoryAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/faq");

  const parsed = faqCategorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    redirect(`/admin/faq?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid category")}`);
  }

  const slug = await uniqueFaqCategorySlug(parsed.data.name, id);
  await prisma.faqCategory.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder ?? 0,
      published: formData.get("published") === "on",
    },
  });

  revalidateFaq();
  redirect("/admin/faq");
}

export async function deleteFaqCategoryAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/faq");
  await prisma.faqCategory.delete({ where: { id } });
  revalidateFaq();
  redirect("/admin/faq");
}

export async function createFaqArticleAction(formData: FormData) {
  requireSupportModule();
  const admin = await requireAdminPage();

  const parsed = faqArticleSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    redirect(`/admin/faq?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid article")}`);
  }

  const slug = await uniqueFaqArticleSlug(parsed.data.title);
  const article = await prisma.faqArticle.create({
    data: {
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      categoryId: parsed.data.categoryId,
      sortOrder: parsed.data.sortOrder ?? 0,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
      updatedById: admin.id,
    },
  });

  revalidateFaq();
  revalidatePath(`/support/faq/${article.slug}`);
  redirect("/admin/faq");
}

export async function updateFaqArticleAction(formData: FormData) {
  requireSupportModule();
  const admin = await requireAdminPage();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/faq");

  const parsed = faqArticleSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    categoryId: formData.get("categoryId"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) {
    redirect(
      `/admin/faq/${id}?error=${encodeURIComponent(parsed.error.issues[0]?.message || "Invalid article")}`
    );
  }

  const existing = await prisma.faqArticle.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) redirect("/admin/faq");

  const slug = await uniqueFaqArticleSlug(parsed.data.title, id);
  await prisma.faqArticle.update({
    where: { id },
    data: {
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      categoryId: parsed.data.categoryId,
      sortOrder: parsed.data.sortOrder ?? 0,
      published: formData.get("published") === "on",
      featured: formData.get("featured") === "on",
      updatedById: admin.id,
    },
  });

  revalidateFaq();
  revalidatePath(`/admin/faq/${id}`);
  revalidatePath(`/support/faq/${existing.slug}`);
  revalidatePath(`/support/faq/${slug}`);
  redirect("/admin/faq");
}

export async function deleteFaqArticleAction(formData: FormData) {
  requireSupportModule();
  await requireAdminPage();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/faq");
  const existing = await prisma.faqArticle.findUnique({ where: { id }, select: { slug: true } });
  await prisma.faqArticle.delete({ where: { id } });
  revalidateFaq();
  if (existing) revalidatePath(`/support/faq/${existing.slug}`);
  redirect("/admin/faq");
}

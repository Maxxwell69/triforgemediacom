"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import {
  dollarsToCents,
  parseOptionalInventory,
  uniqueProductSlug,
} from "@/lib/shop/catalog";
import { getOrCreateShopSettings } from "@/lib/shop/settings";
import { shopProductSchema, shopSettingsSchema, shopVariantSchema } from "@/lib/validations/shop";

async function requireShopAdmin() {
  if (!hubHas("shop")) {
    throw new Error("Shop module is not enabled");
  }
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return session;
}

function revalidateShop(productId?: string, slug?: string) {
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
  revalidatePath("/admin/shop/settings");
  revalidatePath("/shop");
  if (productId) revalidatePath(`/admin/shop/${productId}`);
  if (slug) revalidatePath(`/shop/${slug}`);
}

function parseProductForm(formData: FormData) {
  const parsed = shopProductSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid product");
  }
  return parsed.data;
}

export async function createProduct(formData: FormData) {
  await requireShopAdmin();
  const data = parseProductForm(formData);
  const priceCents = dollarsToCents(formData.get("price"));
  const slug = await uniqueProductSlug(data.slug || data.title);
  const status = data.status === "ACTIVE" ? "ACTIVE" : "DRAFT";

  const product = await prisma.shopProduct.create({
    data: {
      title: data.title,
      slug,
      description: data.description || null,
      status,
      variants: {
        create: { title: "Default", priceCents },
      },
      ...(data.imageUrl
        ? { images: { create: { url: data.imageUrl, order: 0 } } }
        : {}),
    },
  });

  revalidateShop(product.id, product.slug);
  redirect(`/admin/shop/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  await requireShopAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing product");
  const data = parseProductForm(formData);
  const existing = await prisma.shopProduct.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) throw new Error("Product not found");

  const slug = await uniqueProductSlug(data.slug || data.title, id);
  const status = data.status ?? "DRAFT";

  await prisma.shopProduct.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      description: data.description || null,
      status,
    },
  });

  revalidateShop(id, existing.slug);
  revalidatePath(`/shop/${slug}`);
}

export async function setProductStatus(productId: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  await requireShopAdmin();
  const product = await prisma.shopProduct.update({
    where: { id: productId },
    data: { status },
    select: { slug: true },
  });
  revalidateShop(productId, product.slug);
}

export async function addProductImage(formData: FormData) {
  await requireShopAdmin();
  const productId = String(formData.get("productId") || "");
  const url = String(formData.get("imageUrl") || "").trim();
  if (!productId) throw new Error("Missing product");
  if (!url) throw new Error("Upload or paste an image URL");

  const last = await prisma.shopProductImage.findFirst({
    where: { productId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.shopProductImage.create({
    data: { productId, url, order: (last?.order ?? -1) + 1 },
  });

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  revalidateShop(productId, product?.slug);
}

export async function removeProductImage(imageId: string) {
  await requireShopAdmin();
  const image = await prisma.shopProductImage.delete({
    where: { id: imageId },
    select: { productId: true, product: { select: { slug: true } } },
  });
  revalidateShop(image.productId, image.product.slug);
}

export async function addVariant(formData: FormData) {
  await requireShopAdmin();
  const productId = String(formData.get("productId") || "");
  if (!productId) throw new Error("Missing product");
  const parsed = shopVariantSchema.safeParse({
    title: formData.get("title"),
    sku: formData.get("sku"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid variant");
  }

  await prisma.shopVariant.create({
    data: {
      productId,
      title: parsed.data.title,
      sku: parsed.data.sku || null,
      priceCents: dollarsToCents(formData.get("price")),
      inventory: parseOptionalInventory(formData.get("inventory")),
    },
  });

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  revalidateShop(productId, product?.slug);
}

export async function updateVariant(formData: FormData) {
  await requireShopAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing variant");
  const parsed = shopVariantSchema.safeParse({
    title: formData.get("title"),
    sku: formData.get("sku"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid variant");
  }

  const variant = await prisma.shopVariant.update({
    where: { id },
    data: {
      title: parsed.data.title,
      sku: parsed.data.sku || null,
      priceCents: dollarsToCents(formData.get("price")),
      inventory: parseOptionalInventory(formData.get("inventory")),
    },
    select: { productId: true, product: { select: { slug: true } } },
  });
  revalidateShop(variant.productId, variant.product.slug);
}

export async function deleteVariant(variantId: string) {
  await requireShopAdmin();
  const variant = await prisma.shopVariant.findUnique({
    where: { id: variantId },
    select: { productId: true, product: { select: { slug: true, _count: { select: { variants: true } } } } },
  });
  if (!variant) throw new Error("Variant not found");
  if (variant.product._count.variants <= 1) {
    throw new Error("A product needs at least one variant");
  }
  await prisma.shopVariant.delete({ where: { id: variantId } });
  revalidateShop(variant.productId, variant.product.slug);
}

export async function updateShopSettings(formData: FormData) {
  await requireShopAdmin();
  await getOrCreateShopSettings();
  const parsed = shopSettingsSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid settings");
  }

  await prisma.shopSettings.update({
    where: { id: "default" },
    data: parsed.data,
  });
  revalidateShop();
}

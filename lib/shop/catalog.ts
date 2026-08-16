import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hubHas } from "@/lib/hub/modules";

export { centsToDollarInput, formatPriceCents } from "./price";

export function requireShopModule() {
  if (!hubHas("shop")) notFound();
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "product";
}

export async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (true) {
    const existing = await prisma.shopProduct.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${n}`;
    n += 1;
  }
}

export function dollarsToCents(raw: FormDataEntryValue | null): number {
  const value = String(raw ?? "").trim();
  if (!value) throw new Error("Price is required");
  const dollars = Number(value);
  if (!Number.isFinite(dollars) || dollars < 0) {
    throw new Error("Enter a valid price");
  }
  const cents = Math.round(dollars * 100);
  if (cents > 10_000_000) throw new Error("Price is too high");
  return cents;
}

export function parseOptionalInventory(raw: FormDataEntryValue | null): number | null {
  if (raw === null || String(raw).trim() === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Inventory must be a non-negative whole number, or blank for unlimited");
  }
  return value;
}

const publishedInclude = {
  images: { orderBy: { order: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
  files: { select: { id: true } },
};

export async function listPublishedProducts() {
  return prisma.shopProduct.findMany({
    where: { status: "ACTIVE" },
    include: publishedInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedProductBySlug(slug: string) {
  return prisma.shopProduct.findFirst({
    where: { slug, status: "ACTIVE" },
    include: publishedInclude,
  });
}

export async function listAdminProducts() {
  return prisma.shopProduct.findMany({
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      variants: { orderBy: { createdAt: "asc" } },
      _count: { select: { variants: true, images: true, files: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

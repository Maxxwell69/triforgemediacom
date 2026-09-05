import { z } from "zod";

export const faqCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

export const faqArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title must be under 160 characters"),
  body: z
    .string()
    .trim()
    .min(10, "Article body is too short")
    .max(20000, "Article body must be under 20,000 characters"),
  categoryId: z.string().min(1, "Pick a category"),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

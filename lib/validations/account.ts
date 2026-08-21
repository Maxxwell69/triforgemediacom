import { z } from "zod";

export const nameIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(80, "Name must be 80 characters or less"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .max(32, "Username must be 32 characters or less")
    .refine(
      (v) => v === "" || (v.length >= 3 && /^[a-z0-9._]+$/.test(v)),
      "Username must be 3–32 characters using letters, numbers, dots, or underscores"
    ),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  currentPassword: z.string().min(1, "Enter your current password"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const adminSetPasswordSchema = z
  .object({
    userId: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

import { z } from "zod";

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

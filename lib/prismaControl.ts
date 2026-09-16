import { PrismaClient } from "@prisma/client";

/**
 * Hub 0 / Create Hub registry. Always the `public` schema.
 * Request-scoped tenant access goes through `prisma` in lib/prisma.ts.
 */

const globalForControl = globalThis as unknown as {
  controlPrisma: PrismaClient | undefined;
};

export const controlPrisma =
  globalForControl.controlPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForControl.controlPrisma = controlPrisma;
}

import { PrismaClient } from "@prisma/client";

/**
 * Hub 0 / control-plane client (`public` schema).
 * Client hub member data: `getRequestPrisma()` or `getTenantPrisma()` in lib/hub.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

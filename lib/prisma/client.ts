import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client.
 * In development, reuses the same instance across hot reloads.
 * In production, creates a single instance.
 *
 * IMPORTANT: Prisma connects as the postgres superuser which BYPASSES RLS.
 * Always verify user authorization BEFORE any Prisma query via supabase.auth.getUser().
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

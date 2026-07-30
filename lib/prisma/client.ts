import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "";
  if (!url) return url;

  if (url.includes("connection_limit=")) {
    url = url.replace(/connection_limit=\d+/, "connection_limit=1");
  } else {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=1";
  }

  if (!url.includes("connect_timeout=")) {
    url += "&connect_timeout=15";
  }

  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

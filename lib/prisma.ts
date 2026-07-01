import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { loggers } from '@/lib/logger';

const dbLog = loggers.db;

function createPrismaClient(): PrismaClient {
  const connectionString = globalThis.process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Sanitasi password untuk logging aman
  const sanitizedUrl = connectionString.replace(/:([^:@]+)@/, ':****@');
  console.log(`[PRISMA DB URL] Connecting with: ${sanitizedUrl}`);

  // Gunakan connection string langsung, bukan Pool instance.
  // Hindari dual-pg instanceof issue: adapter-pg punya pg@8.21.0 di nested
  // node_modules, sementara app pakai pg@8.22.0 di root. instanceof Pool
  // dari dua versi pg berbeda selalu false.
  const adapter = new PrismaPg(connectionString);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

dbLog.debug(
  {
    poolMax: Number(process.env.PG_POOL_MAX ?? 10),
    connectionTimeoutMs: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 10_000),
  },
  'Prisma client initialized',
);

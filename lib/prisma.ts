import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { loggers } from '@/lib/logger';

const dbLog = loggers.db;

function createPrismaClient(): PrismaClient {
  const connectionString = globalThis.process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString,
    max: Number(globalThis.process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: Number(globalThis.process.env.PG_CONNECTION_TIMEOUT_MS ?? 10_000),
    keepAlive: true,
  });

  pool.on('error', (err) => {
    dbLog.error({ err }, 'PostgreSQL idle client error on connection pool');
  });

  const adapter = new PrismaPg(pool);

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

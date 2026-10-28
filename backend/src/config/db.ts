import { PrismaClient } from '@prisma/client';

// Global singleton Prisma client (Pillars 28: Connection Pooling, 41: Prevent Memory Leaks)
declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export let isDatabaseConnected = false;

// Check connectivity on startup
export const verifyDatabaseConnection = async (): Promise<boolean> => {
  if (!process.env.DATABASE_URL) {
    console.log('[Database] DATABASE_URL not set. Running in hybrid local-persistent mode.');
    isDatabaseConnected = false;
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    isDatabaseConnected = true;
    console.log('✅ [Database] PostgreSQL connection verified via Prisma.');
    return true;
  } catch (err: any) {
    console.warn('⚠️ [Database] Could not connect to PostgreSQL. Falling back to local storage adapter:', err.message);
    isDatabaseConnected = false;
    return false;
  }
};

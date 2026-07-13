import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Detect a stale cached client that was created before newer models (Payment, Expense)
// were added to the Prisma schema, so a `db:push` without server restart still works.
function isStaleClient(c: PrismaClient | undefined): boolean {
  if (!c) return true;
  return !(c as unknown as { payment?: unknown }).payment;
}

const client = isStaleClient(globalForPrisma.prisma)
  ? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  : globalForPrisma.prisma!

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client

export const db = client
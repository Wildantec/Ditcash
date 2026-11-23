import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Next conserva globalThis entre recargas. Una instancia creada antes de
// regenerar Prisma no conoce los modelos nuevos, tampoco en $transaction.
const cachedClient = globalForPrisma.prisma
const generatedDelegates = Prisma.dmmf.datamodel.models.map(
  ({ name }) => name.charAt(0).toLowerCase() + name.slice(1)
)
const cacheMatchesSchema = cachedClient && generatedDelegates.every(
  name => name in cachedClient
)

export const prisma = cacheMatchesSchema ? cachedClient : new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

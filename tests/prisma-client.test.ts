import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PrismaClient } from '@prisma/client'

test('reemplaza la instancia global anterior al esquema de servicio tecnico', async () => {
  const cache = globalThis as unknown as { prisma: PrismaClient }
  const staleClient = { user: {} } as unknown as PrismaClient
  cache.prisma = staleClient

  const { prisma } = await import('../lib/prisma')
  try {
    assert.notEqual(prisma, staleClient)
    assert.equal(typeof prisma.mesServicioTecnico.create, 'function')
    assert.equal(typeof prisma.equipoServicioTecnico.upsert, 'function')
    assert.equal(typeof prisma.equipoServicioTecnico.update, 'function')
    assert.equal(typeof prisma.reparacionServicioTecnico.create, 'function')
    assert.equal(typeof prisma.reparacionServicioTecnico.update, 'function')
    assert.equal(typeof prisma.vehiculo.findMany, 'function')
    if (process.env.NODE_ENV !== 'production') assert.equal(cache.prisma, prisma)
  } finally {
    await prisma.$disconnect()
    delete (globalThis as { prisma?: PrismaClient }).prisma
  }
})

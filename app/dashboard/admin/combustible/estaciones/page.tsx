import { prisma } from '@/lib/prisma'
import ModuloEstacionesClient from '../../../../components/combustible/ModuloEstacionesClient'

export const dynamic = 'force-dynamic'

export default async function EstacionesCombustiblePage() {
  const gasolineras = await prisma.gasolinera.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <ModuloEstacionesClient gasolinerasIniciales={gasolineras} />
}
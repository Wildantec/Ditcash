import { prisma } from '@/lib/prisma'
import VistaMovilRutaClient from '@/components/combustible/VistaMovilRutaClient'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/authorization'

export const dynamic = 'force-dynamic'

export default async function RutaVendedorPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')
  const userId = usuario.id
  const vehiculos = await prisma.vehiculo.findMany({
    where: {
      asignaciones: {
        some: { userId, fechaFin: null }
      }
    },
    orderBy: { placa: 'asc' },
    include: {
      asignaciones: {
        where: { fechaFin: null }
      }
    }
  })

  const rutaAbierta = await prisma.registroRutaDiaria.findFirst({
    where: {
      userId: userId,
      procesado: false,
      kmRecorridos: 0 
    },
    orderBy: { createdAt: 'desc' }
  })

  const vehiculoSugerido = vehiculos.find(v => v.asignaciones.some(a => a.userId === userId))

  return (
    <VistaMovilRutaClient 
      userId={userId}
      vehiculos={vehiculos}
      rutaAbiertaInicial={rutaAbierta}
      placaSugerida={vehiculoSugerido?.placa || ''}
      kmSugerido={vehiculoSugerido?.kmActual || 0}
    />
  )
}
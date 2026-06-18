import { prisma } from '@/lib/prisma'
import VistaMovilRutaClient from '../../../components/combustible/VistaMovilRutaClient'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function RutaVendedorPage() {
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get('user_id')?.value
  const userId = userIdCookie ? parseInt(userIdCookie) : 1 
  const vehiculos = await prisma.vehiculo.findMany({
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
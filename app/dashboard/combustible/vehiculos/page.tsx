import { prisma } from '@/lib/prisma'
import ModuloVehiculosAdmin from '../../../../components/combustible/ParametrizacionFormularios'

export const dynamic = 'force-dynamic'

export default async function ParametrizacionCombustiblePage() {
  // 🚀 Extraemos las transacciones del Kardex para alimentar la tabla abierta
  const registrosKardex = await prisma.kardexVehiculo.findMany({
    include: {
      vehiculo: {
        include: {
          asignaciones: {
            where: { fechaFin: null },
            include: { user: true }
          }
        }
      }
    },
    orderBy: {
      fechaTransaccion: 'desc' // Orden Cronológico Inverso (Últimos movimientos primero)
    }
  })

  // Catálogo base de vehículos para alimentar listas desplegables de formularios
  const vehiculos = await prisma.vehiculo.findMany({
    orderBy: { placa: 'asc' }
  })

  const vendedoresAraujo = await prisma.user.findMany({
    where: { rol: 'VENDEDOR', activo: true },
    orderBy: { nombre: 'asc' }
  })

  return (
    <ModuloVehiculosAdmin 
      kardexInicial={registrosKardex}
      vehiculos={vehiculos} 
      vendedores={vendedoresAraujo} 
    />
  )
}
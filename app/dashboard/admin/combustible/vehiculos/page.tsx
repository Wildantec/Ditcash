import { prisma } from '@/lib/prisma'
import ModuloVehiculosAdmin from '../../../../components/combustible/ParametrizacionFormularios'

export const dynamic = 'force-dynamic'

export default async function ParametrizacionCombustiblePage() {
  const vehiculos = await prisma.vehiculo.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      asignaciones: {
        where: { fechaFin: null },
        include: { user: true }
      }
    }
  })
  const vendedoresAraujo = await prisma.user.findMany({
    where: { rol: 'VENDEDOR', activo: true },
    orderBy: { nombre: 'asc' }
  })

  return (
    <ModuloVehiculosAdmin 
      vehiculosIniciales={vehiculos} 
      vendedores={vendedoresAraujo} 
    />
  )
}
import { prisma } from '@/lib/prisma'
import { getUsuariosAction } from '@/app/actions/usuarios'
import ModuloFacturasClient from '../../../../components/combustible/ModuloFacturasClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FacturasPage() {
  const [vehiculos, gasolineras, facturas, personal] = await Promise.all([
    prisma.vehiculo.findMany({ orderBy: { placa: 'asc' } }).catch(() => []),
    prisma.gasolinera.findMany({ orderBy: { nombre: 'asc' } }).catch(() => []),
    prisma.registroCombustible.findMany({
      include: {
        vehiculo: true,
        gasolinera: true,
        user: true
      },
      orderBy: { fechaFactura: 'desc' }
    }).catch(() => []),
    getUsuariosAction()
  ])
  const vendedoresActivos = personal.filter((u: any) => u.rol === 'VENDEDOR')

  return (
    <ModuloFacturasClient 
      vehiculos={vehiculos} 
      gasolineras={gasolineras} 
      facturasIniciales={facturas} 
      vendedores={vendedoresActivos}
    />
  )
}
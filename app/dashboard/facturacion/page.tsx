import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import FacturacionClient from '@/components/facturacion/FacturacionClient'

export const dynamic = 'force-dynamic'

export default async function FacturacionPage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')
  if (!userHasPermission(usuario, 'facturacion', 'ver')) redirect('/dashboard')

  const [semanas, vendedores] = await Promise.all([
    prisma.semanaComercial.findMany({ orderBy: { fechaInicio: 'desc' } }),
    prisma.vendedor.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }]
    })
  ])

  return (
    <FacturacionClient
      semanas={semanas.map(semana => ({
        ...semana,
        fechaInicio: semana.fechaInicio.toISOString(),
        fechaFin: semana.fechaFin.toISOString(),
        creadaEn: semana.creadaEn.toISOString()
      }))}
      vendedores={vendedores}
      puedeCrear={userHasPermission(usuario, 'facturacion', 'crear')}
      puedeEditar={userHasPermission(usuario, 'facturacion', 'editar')}
    />
  )
}

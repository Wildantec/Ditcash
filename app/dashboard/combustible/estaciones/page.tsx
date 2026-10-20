import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import { redirect } from 'next/navigation'
import ModuloEstacionesClient from '../../../../components/combustible/ModuloEstacionesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EstacionesCombustiblePage() {
  const usuario = await getCurrentUser()
  if (!usuario) redirect('/login')
  if (!userHasPermission(usuario, 'estaciones', 'ver')) redirect('/dashboard')

  const gasolinerasDb = await prisma.gasolinera.findMany({
    include: {
      registrosCombustible: {
        include: {
          vehiculo: true,
          user: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const movimientosKardex: any[] = [];

  gasolinerasDb.forEach((g: any) => {
    if (g.tieneConvenio && Number(g.montoRecarga || 0) > 0) {
      movimientosKardex.push({
        id: `ACRED-${g.id}`,
        nombreEstacion: g.nombre ? String(g.nombre).toUpperCase() : 'S/E',
        fecha: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
        numFactura: g.numFactura || 'S/N',
        acreditacion: Number(g.montoRecarga || 0),
        consumo: 0,
        esConvenio: true
      });
    }
    const consumos = g.registrosCombustible || [];
    consumos.forEach((c: any) => {
      movimientosKardex.push({
        id: `CONSU-${c.id}`,
        nombreEstacion: g.nombre ? String(g.nombre).toUpperCase() : 'S/E',
        fecha: c.fechaFactura ? new Date(c.fechaFactura).toISOString().split('T')[0] : '',
        createdAt: c.createdAt ? new Date(c.createdAt) : (c.fechaFactura ? new Date(c.fechaFactura) : new Date()),
        numFactura: c.numFactura || 'SECUENCIAL',
        acreditacion: 0,
        consumo: Number(c.precioTotal || 0),
        esConvenio: !c.fueraDeConvenio
      });
    });
  });

  const kardexOrdenado = movimientosKardex.sort((a, b) => {
    const tiempoA = new Date(a.createdAt).getTime();
    const tiempoB = new Date(b.createdAt).getTime();
    return tiempoA - tiempoB;
  });

  const nombresEstacionesUnicas = Array.from(
    new Set(
      gasolinerasDb
        .filter((g: any) => g.tieneConvenio === true)
        .map((g: any) => g.nombre ? g.nombre.trim().toUpperCase() : '')
        .filter(Boolean)
    )
  ).sort();

  const estacionesSoloConvenio = nombresEstacionesUnicas;

  return (
    <ModuloEstacionesClient 
      movimientosIniciales={kardexOrdenado} 
      nombresEstaciones={nombresEstacionesUnicas}
      estacionesSoloConvenio={estacionesSoloConvenio}
    />
  )
}
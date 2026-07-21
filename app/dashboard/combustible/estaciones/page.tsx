import { prisma } from '@/lib/prisma'
import { getUsuariosAction } from '@/app/actions/usuarios'
import ModuloEstacionesClient from '../../../../components/combustible/ModuloEstacionesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EstacionesCombustiblePage() {
  const [gasolinerasDb, personal] = await Promise.all([
    prisma.gasolinera.findMany({
      include: {
        registrosCombustible: {
          include: {
            vehiculo: true,
            user: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }).catch(() => []),
    getUsuariosAction().catch(() => [])
  ])

  const movimientosKardex: any[] = [];

  gasolinerasDb.forEach((g: any) => {
    // 1. MAPEAMOS LAS ACREDITACIONES CON SU MARCA DE TIEMPO REAL
    if (g.tieneConvenio && Number(g.montoRecarga || 0) > 0) {
      movimientosKardex.push({
        id: `ACRED-${g.id}`,
        nombreEstacion: g.nombre ? String(g.nombre).toUpperCase() : 'S/E',
        fecha: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : '',
        // 🚀 CLAVE: Guardamos el createdAt original con hora y segundos de la base de datos
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
        numFactura: g.numFactura || 'S/N',
        acreditacion: Number(g.montoRecarga || 0),
        consumo: 0,
        esConvenio: true
      });
    }

    // 2. MAPEAMOS LOS CONSUMOS CON SU MARCA DE TIEMPO REAL
    const consumos = g.registrosCombustible || [];
    consumos.forEach((c: any) => {
      movimientosKardex.push({
        id: `CONSU-${c.id}`,
        nombreEstacion: g.nombre ? String(g.nombre).toUpperCase() : 'S/E',
        // Mostramos en la tabla la fecha en la que se facturó
        fecha: c.fechaFactura ? new Date(c.fechaFactura).toISOString().split('T')[0] : '',
        // 🚀 CLAVE: Usamos el createdAt del registro de consumo para saber exactamente CUÁNDO se insertó físicamente
        createdAt: c.createdAt ? new Date(c.createdAt) : (c.fechaFactura ? new Date(c.fechaFactura) : new Date()),
        numFactura: c.numFactura || 'SECUENCIAL',
        acreditacion: 0,
        consumo: Number(c.precioTotal || 0),
        esConvenio: !c.fueraDeConvenio
      });
    });
  });

  // 3. 🚀 ORDENAMIENTO DE ENTRADA: Ordenamos estrictamente por fecha de creación (milisegundos reales)
  // De esta forma, se calculan en el orden real de inserción cronológica
  const kardexOrdenado = movimientosKardex.sort((a, b) => {
    const tiempoA = new Date(a.createdAt).getTime();
    const tiempoB = new Date(b.createdAt).getTime();
    return tiempoA - tiempoB;
  });

  // Nota: Ya no calculamos el saldo acumulado de forma global en la Page del servidor, 
  // ya que tu componente ModuloEstacionesClient que corregimos anteriormente lo calcula e independiza
  // de forma perfecta por cada estación de manera interna.

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
import { prisma } from '@/lib/prisma'
import ModuloFacturasClient from '../../../../components/combustible/ModuloFacturasClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FacturasPage() {
  const [vehiculosDb, gasolinerasDb, facturasDb, vendedoresDb] = await Promise.all([
    prisma.vehiculo.findMany({ orderBy: { placa: 'asc' } }).catch(() => []),
    prisma.gasolinera.findMany({ orderBy: { nombre: 'asc' } }).catch(() => []),
    prisma.registroCombustible.findMany({
      include: {
        vehiculo: true,
        gasolinera: true,
        user: {
          include: {
            vendedor: true 
          }
        }
      },
      orderBy: { fechaFactura: 'desc' }
    }).catch(() => []),
    prisma.user.findMany({
      where: { rol: 'VENDEDOR', activo: true },
      include: {
        asignacionesVehiculo: {
          where: { fechaFin: null },
          include: { vehiculo: true }
        }
      },
      orderBy: { nombre: 'asc' }
    }).catch(() => [])
  ])

  const facturasIniciales = facturasDb.map((r: any) => {
    const nombreChofer = r.user?.nombre || 
                         (r.user?.vendedor ? `${r.user.vendedor.nombre} ${r.user.vendedor.apellido || ''}` : '') || 
                         r.chofer || 
                         'SIN CONDUCTOR ASIGNADO';

    return {
      id: r.id ? Number(r.id) : Math.random(),
      fechaFactura: r.fechaFactura ? new Date(r.fechaFactura).toISOString().split('T')[0] : '',
      chofer: nombreChofer.trim().toUpperCase(), 
      placa: r.vehiculo ? r.vehiculo.placa : (r.placaCarro || ''),
      placaCarro: r.vehiculo ? r.vehiculo.placa : (r.placaCarro || ''),
      gasolineraId: r.gasolineraId ? Number(r.gasolineraId) : 0,
      numFactura: r.numFactura || '',
      precioTotal: r.precioTotal ? Number(r.precioTotal) : 0,
      galones: r.galones ? Number(r.galones) : 0,
      metodoPago: r.metodoPago || 'CONVENIO',
      nombreEstacionManual: r.fueraDeConvenio && r.gasolinera ? r.gasolinera.nombre : '',
      gasolinera: r.gasolinera ? {
        id: Number(r.gasolinera.id),
        nombre: r.gasolinera.nombre || '',
        numFactura: r.gasolinera.numFactura || ''
      } : null
    }
  })

  const gasolinerasAgrupadas: { [key: string]: any } = {}

  gasolinerasDb.forEach((g: any) => {
    if (g.tieneConvenio) {
      const nombreClave = (g.nombre || '').trim().toUpperCase();
      const montoActualR = g.montoActual ? Number(g.montoActual) : 0;
      const montoRecargaR = g.montoRecarga ? Number(g.montoRecarga) : 0;

      if (!gasolinerasAgrupadas[nombreClave]) {
        gasolinerasAgrupadas[nombreClave] = {
          id: Number(g.id),
          nombre: nombreClave,
          numFactura: g.numFactura || '',
          montoActual: montoActualR,
          montoRecarga: montoRecargaR,
          acreditaciones: [{ id: Number(g.id), montoActual: montoActualR }]
        }
      } else {
        gasolinerasAgrupadas[nombreClave].montoActual += montoActualR;
        gasolinerasAgrupadas[nombreClave].montoRecarga += montoRecargaR;
        gasolinerasAgrupadas[nombreClave].acreditaciones.push({ id: Number(g.id), montoActual: montoActualR });
      }
    }
  })
  const gasolineras = Object.values(gasolinerasAgrupadas)
  const vehiculos = vehiculosDb.map((v: any) => ({
    id: Number(v.id),
    placa: v.placa || '',
    marcaModelo: v.marcaModelo || ''
  }))
  const vendedores = vendedoresDb.map((v: any) => ({
    id: Number(v.id),
    nombre: v.nombre || '',
    asignacionesVehiculo: Array.isArray(v.asignacionesVehiculo) ? v.asignacionesVehiculo.map((a: any) => ({
      vehiculo: a.vehiculo ? { placa: a.vehiculo.placa || '' } : null
    })) : []
  }))

  return (
    <ModuloFacturasClient 
      vehiculos={vehiculos} 
      gasolineras={gasolineras} 
      facturasIniciales={facturasIniciales} 
      vendedores={vendedores}
    />
  )
}
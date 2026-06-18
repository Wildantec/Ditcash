'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarCierreRutaDiario(data: {
  userId: number
  placaCarro: string
  kmRecorridos: number
}) {
  try {
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { placa: data.placaCarro.toUpperCase().trim() }
    })
    
    if (!vehiculo) {
      return { success: false, error: 'El vehículo con esa placa no está registrado en Ditcash.' }
    }
    await prisma.registroRutaDiaria.create({
      data: {
        userId: data.userId,
        placaCarro: data.placaCarro.toUpperCase().trim(),
        kmRecorridos: data.kmRecorridos,
        procesado: false
      }
    })
    const nuevoKmActual = vehiculo.kmActual + data.kmRecorridos
    const kmDesdeUltimoAceite = nuevoKmActual - vehiculo.kmUltimoAceite
    const dispararAlerta = kmDesdeUltimoAceite >= vehiculo.intervaloAlerta

    await prisma.vehiculo.update({
      where: { id: vehiculo.id },
      data: {
        kmActual: nuevoKmActual,
        alertaMantenimiento: dispararAlerta
      }
    })

    return { success: true, mensaje: 'Jornada guardada y kilometraje actualizado con éxito.' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function registrarFacturaCombustible(data: {
  userId: number          
  placaCarro: string      
  gasolineraId: number    
  numFactura: string     
  precioTotal: number     
  galones: number         
  fechaFactura: Date      
  metodoPago?: string
}) {
  try {
    const facturaExistente = await prisma.registroCombustible.findUnique({
      where: { numFactura: data.numFactura.trim() }
    })
    if (facturaExistente) {
      return { success: false, error: 'Este número de factura ya fue registrado anteriormente.' }
    }

    const vehiculo = await prisma.vehiculo.findUnique({ where: { placa: data.placaCarro.toUpperCase().trim() } })
    const gasolinera = await prisma.gasolinera.findUnique({ where: { id: data.gasolineraId } })

    if (!vehiculo) return { success: false, error: 'Vehículo no encontrado.' }
    if (!gasolinera) return { success: false, error: 'Gasolinera no encontrada.' }

    const fueraDeConvenio = !gasolinera.tieneConvenio
    const rutasPendientes = await prisma.registroRutaDiaria.findMany({
      where: {
        userId: data.userId,
        placaCarro: data.placaCarro.toUpperCase().trim(),
        procesado: false
      }
    })

    const kmConsolidadosGPS = rutasPendientes.reduce((sum, ruta) => sum + ruta.kmRecorridos, 0)

    await prisma.registroCombustible.create({
      data: {
        userId: data.userId,
        vehiculoId: vehiculo.id,
        gasolineraId: gasolinera.id,
        kmRecorridos: kmConsolidadosGPS > 0 ? kmConsolidadosGPS : 0,
        precioTotal: data.precioTotal,
        galones: data.galones,
        numFactura: data.numFactura.trim(),
        fueraDeConvenio: fueraDeConvenio,
        fechaFactura: data.fechaFactura
      }
    })
    if (rutasPendientes.length > 0) {
      await prisma.registroRutaDiaria.updateMany({
        where: {
          id: { in: rutasPendientes.map(r => r.id) }
        },
        data: { procesado: true }
      })
    }

    return { 
      success: true, 
      mensaje: 'Factura asentada correctamente.',
      auditoria: { fueraDeConvenio, kmAuditados: kmConsolidadosGPS }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
export async function crearVehiculoAction(data: { placa: string; marcaModelo: string; kmActual: number; userId?: number }) {
  try {
    const placaNormalizada = data.placa.toUpperCase().trim()
    const existente = await prisma.vehiculo.findUnique({ where: { placa: placaNormalizada } })
    if (existente) return { success: false, error: 'Esta placa ya está registrada.' }
    const nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        placa: placaNormalizada,
        marcaModelo: data.marcaModelo.toUpperCase().trim(),
        kmActual: data.kmActual,
        kmUltimoAceite: data.kmActual
      }
    })
    if (data.userId) {
      await prisma.asignacionVehiculo.updateMany({
        where: { userId: data.userId, fechaFin: null },
        data: { fechaFin: new Date(), kmRecepcion: data.kmActual }
      })

      await prisma.asignacionVehiculo.create({
        data: {
          userId: data.userId,
          vehiculoId: nuevoVehiculo.id,
          kmEntrega: data.kmActual
        }
      })
    }

    revalidatePath('/dashboard/admin/combustible/vehiculos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
export async function crearGasolineraAction(data: { nombre: string; ciudad: string; tieneConvenio: boolean }) {
  try {
    await prisma.gasolinera.create({
      data: {
        nombre: data.nombre.toUpperCase().trim(),
        ciudad: data.ciudad.toUpperCase().trim(),
        tieneConvenio: data.tieneConvenio
      }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
export async function editarVehiculoAction(id: number, data: { placa: string; marcaModelo: string; kmActual: number; userId?: number }) {
  try {
    const placaNormalizada = data.placa.toUpperCase().trim()
    
    const existe = await prisma.vehiculo.findFirst({
      where: { placa: placaNormalizada, NOT: { id } }
    })
    if (existe) return { success: false, error: 'Esta placa ya está registrada en otra unidad.' }
    const vehiculo = await prisma.vehiculo.update({
      where: { id },
      data: {
        placa: placaNormalizada,
        marcaModelo: data.marcaModelo.toUpperCase().trim(),
        kmActual: data.kmActual
      }
    })
    const asignacionActual = await prisma.asignacionVehiculo.findFirst({
      where: { vehiculoId: id, fechaFin: null }
    })
    if (data.userId && (!asignacionActual || asignacionActual.userId !== data.userId)) {
      if (asignacionActual) {
        await prisma.asignacionVehiculo.update({
          where: { id: asignacionActual.id },
          data: { fechaFin: new Date(), kmRecepcion: data.kmActual }
        })
      }
      await prisma.asignacionVehiculo.updateMany({
        where: { userId: data.userId, fechaFin: null },
        data: { fechaFin: new Date(), kmRecepcion: data.kmActual }
      })
      await prisma.asignacionVehiculo.create({
        data: {
          userId: data.userId,
          vehiculoId: id,
          kmEntrega: data.kmActual
        }
      })
    } 
    else if (!data.userId && asignacionActual) {
      await prisma.asignacionVehiculo.update({
        where: { id: asignacionActual.id },
        data: { fechaFin: new Date(), kmRecepcion: data.kmActual }
      })
    }

    revalidatePath('/dashboard/admin/combustible/vehiculos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function eliminarVehiculoAction(id: number) {
  try {
    await prisma.vehiculo.delete({ where: { id } })
    revalidatePath('/dashboard/admin/combustible/vehiculos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar el vehículo porque contiene historiales de rutas o combustible amarrados.' }
  }
}
export async function editarGasolineraAction(id: number, data: { nombre: string; ciudad: string; tieneConvenio: boolean }) {
  try {
    await prisma.gasolinera.update({
      where: { id },
      data: {
        nombre: data.nombre.toUpperCase().trim(),
        ciudad: data.ciudad.toUpperCase().trim(),
        tieneConvenio: data.tieneConvenio
      }
    })
    
    revalidatePath('/dashboard/admin/combustible/estaciones')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function eliminarGasolineraAction(id: number) {
  try {
    await prisma.gasolinera.delete({ where: { id } })
    revalidatePath('/dashboard/admin/combustible/estaciones')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar la estación porque tiene facturas históricas registradas.' }
  }
}
export async function registrarInicioJornada(data: {
  userId: number
  placaCarro: string
  kmInicial: number
}) {
  try {
    const placaNormalizada = data.placaCarro.toUpperCase().trim()
    const vehiculo = await prisma.vehiculo.findUnique({ where: { placa: placaNormalizada } })
    
    if (!vehiculo) return { success: false, error: 'El vehículo no está registrado.' }
    await prisma.registroRutaDiaria.create({
      data: {
        userId: data.userId,
        placaCarro: placaNormalizada,
        kmRecorridos: 0,
        procesado: false,
      }
    })

    return { success: true, mensaje: 'Jornada matutina inicializada con éxito.' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
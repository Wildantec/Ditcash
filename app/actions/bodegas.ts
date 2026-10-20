'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { currentUserHasPermission } from '@/lib/authorization'

async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  return currentUserHasPermission(moduloId, accion)
}

export async function toggleBodegaPrincipal(idBodegaAraujos: string, esPrincipal: boolean) {
  try {
    const autorizado = await validarAccionSesion('bodegas', 'editar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR la configuración de bodegas.' }
    }

    await prisma.bodegaConfig.upsert({
      where: { id_bodega_araujo: idBodegaAraujos },
      update: { es_principal: esPrincipal },
      create: {
        id_bodega_araujo: idBodegaAraujos,
        es_principal: esPrincipal
      }
    })

    revalidatePath('/dashboard/inventario')
    revalidatePath('/dashboard/bodegas')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo guardar la configuración de la bodega" }
  }
}

export async function getBodegasConfigAction() {
  try {
    const autorizado = await validarAccionSesion('bodegas', 'ver')
    if (!autorizado) return []

    return await prisma.bodegaConfig.findMany()
  } catch (error) {
    return []
  }
}

export async function crearBodegaAction(data: { id_bodega_araujo: string; nombre?: string; es_principal?: boolean }) {
  try {
    const autorizado = await validarAccionSesion('bodegas', 'crear')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR bodegas.' }
    }

    await prisma.bodegaConfig.create({
      data: {
        id_bodega_araujo: data.id_bodega_araujo,
        es_principal: data.es_principal || false
      }
    })

    revalidatePath('/dashboard/bodegas')
    revalidatePath('/dashboard/inventario')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Error al crear bodega: ${error.message}` }
  }
}

export async function eliminarBodegaAction(idBodegaAraujos: string) {
  try {
    const autorizado = await validarAccionSesion('bodegas', 'eliminar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR bodegas.' }
    }

    await prisma.bodegaConfig.delete({
      where: { id_bodega_araujo: idBodegaAraujos }
    })

    revalidatePath('/dashboard/bodegas')
    revalidatePath('/dashboard/inventario')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se pudo eliminar la bodega seleccionada.' }
  }
}
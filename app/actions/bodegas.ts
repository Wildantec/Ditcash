'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleBodegaPrincipal(idBodegaAraujos: string, esPrincipal: boolean) {
  try {
    await prisma.bodegaConfig.upsert({
      where: { id_bodega_araujo: idBodegaAraujos },
      update: { es_principal: esPrincipal },
      create: {
        id_bodega_araujo: idBodegaAraujos,
        es_principal: esPrincipal
      }
    })
    revalidatePath('/dashboard/inventario')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo guardar la configuración de la bodega" }
  }
}
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleBodegaPrincipal(idBodegaAraujos: string, esPrincipal: boolean) {
  try {
    // Usamos upsert para evitar duplicados basándonos en el campo único id_bodega_araujo
    await prisma.bodegaConfig.upsert({
      where: { id_bodega_araujo: idBodegaAraujos },
      update: { es_principal: esPrincipal },
      create: {
        id_bodega_araujo: idBodegaAraujos,
        es_principal: esPrincipal
      }
    })

    // Revalidamos la ruta del inventario global del vendedor para que el cambio impacte en vivo
    revalidatePath('/dashboard/inventario')
    return { success: true }
  } catch (error) {
    console.error("Error al configurar la bodega en Ditcash:", error)
    return { success: false, error: "No se pudo guardar la configuración de la bodega" }
  }
}
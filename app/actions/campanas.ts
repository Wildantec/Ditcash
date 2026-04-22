'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// 1. OBTENER TODAS LAS CAMPAÑAS
export async function getAllCampanas() {
  try {
    const campanas = await prisma.campana.findMany({
      orderBy: { id: 'desc' }
    })
    return campanas
  } catch (error) {
    console.error("Error al obtener campañas:", error)
    return []
  }
}

// 2. OBTENER ID DE CAMPAÑA ACTIVA (SIDEBAR)
export async function getActiveCampanaId() {
  try {
    const campana = await prisma.campana.findFirst({
      where: { activa: true },
      select: { id: true }
    })
    return campana?.id || null
  } catch (error) {
    console.error("Error al buscar campaña activa:", error)
    return null
  }
}

// 3. ELIMINAR CAMPAÑA
export async function deleteCampana(id: number) {
  try {
    await prisma.campana.delete({
      where: { id }
    })
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error) {
    return { error: "No se pudo eliminar la campaña" }
  }
}

// 4. CREAR CAMPAÑA (CON SUBIDA DE IMAGEN)
export async function createCampana(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const detalle = formData.get('detalle') as string
    const fechaInicio = formData.get('fecha_inicio') as string
    const fechaFin = formData.get('fecha_cierre') as string
    const estado = formData.get('estado') as string
    const file = formData.get('foto') as File

    let urlImagen = ""

    // Si hay una foto, la subimos a Cloudinary
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadResponse: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'ditcash_campanas' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(buffer)
      })
      urlImagen = uploadResponse.secure_url
    }

    await prisma.campana.create({
      data: {
        nombre,
        descripcion: detalle, // Mapeamos detalle a descripcion de la BD
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        activa: estado === 'Activa',
        urlImagen: urlImagen // Guardamos la URL de la foto
      },
    })

    revalidatePath('/dashboard/admin/campanas')
    revalidatePath('/dashboard/vendedor')
    return { success: true }
  } catch (error) {
    console.error("Error al crear:", error)
    return { error: "No se pudo crear la campaña" }
  }
}

// 5. OBTENER POR ID
export async function getCampanaById(id: number) {
  try {
    const campana = await prisma.campana.findUnique({
      where: { id }
    })
    return campana
  } catch (error) {
    return null
  }
}

// 6. ACTUALIZAR CAMPAÑA
export async function updateCampana(id: number, data: any) {
  try {
    await prisma.campana.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.detalle,
        fechaInicio: new Date(data.fecha_inicio),
        fechaFin: new Date(data.fecha_cierre),
        activa: data.estado === 'Activa',
        // Si mandas una nueva URL de imagen en el data, se actualiza aquí
        ...(data.urlImagen && { urlImagen: data.urlImagen })
      }
    })
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "No se pudo actualizar la campaña" }
  }
}

// 7. CONSULTA PÚBLICA (LIGERA)
export async function getCampanaPublica(id: number) {
  try {
    const campana = await prisma.campana.findUnique({
      where: { id },
      select: { nombre: true, descripcion: true, urlImagen: true } 
    })
    return campana
  } catch (error) {
    return null
  }
}
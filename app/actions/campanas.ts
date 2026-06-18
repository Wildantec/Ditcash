'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function getAllCampanas() {
  try {
    const campanas = await prisma.campana.findMany({
      orderBy: { id: 'desc' }
    })
    return campanas
  } catch (error) {
    return []
  }
}
export async function getActiveCampanaId() {
  try {
    const campana = await prisma.campana.findFirst({
      where: { activa: true },
      select: { id: true }
    })
    return campana?.id || null
  } catch (error) {
    return null
  }
}
export async function deleteCampana(id: number) {
  try {
    const premios = await prisma.premio.findMany({
      where: { 
      },
      select: { id: true }
    });

    const premioIds = premios.map((p:any) => p.id);
    await prisma.$transaction(async (tx:any) => {
      if (premioIds.length > 0) {
        await tx.canje.deleteMany({
          where: { premioId: { in: premioIds } }
        });
      }
      await tx.evidencia.deleteMany({
        where: { campanaId: id }
      });
      await tx.campana.delete({
        where: { id }
      });
    });

    revalidatePath('/dashboard/admin/campanas');
    revalidatePath('/dashboard/vendedor');
    
    return { success: true };
  } catch (error: any) {
    return { 
      error: "No se pudo eliminar: Hay datos protegidos. Intenta borrar primero los premios asociados manualmente." 
    };
  }
}

export async function createCampana(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const detalle = formData.get('detalle') as string
    const fechaInicio = formData.get('fecha_inicio') as string
    const fechaFin = formData.get('fecha_cierre') as string
    const estado = formData.get('estado') as string
    const valor = formData.get('valor') as string 
    const file = formData.get('foto') as File

    let urlImagen = ""
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
        descripcion: detalle,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        activa: estado === 'Activa',
        urlImagen: urlImagen,
        valor: parseFloat(valor) || 0
      },
    })

    revalidatePath('/dashboard/admin/campanas')
    revalidatePath('/dashboard/vendedor')
    return { success: true }
  } catch (error) {
    return { error: "No se pudo crear la campaña" }
  }
}
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
export async function updateCampana(id: number, data: any) {
  try {
    if (!id) throw new Error("ID de campaña no proporcionado");

    await prisma.campana.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.detalle,
        fechaInicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
        fechaFin: data.fecha_cierre ? new Date(data.fecha_cierre) : undefined,
        activa: data.estado === 'Activa',
        valor: parseFloat(data.valor) || 0,
        ...(data.urlImagen && { urlImagen: data.urlImagen })
      }
    })

    revalidatePath('/dashboard/admin/campanas')
    revalidatePath(`/dashboard/admin/campanas/editar/${id}`)
    
    return { success: true }
  } catch (error: any) {
    return { error: `Error en BD: ${error.message || "No se pudo actualizar"}` }
  }
}
export async function getCampanaPublica(id: number) {
  try {
    const campana = await prisma.campana.findUnique({
      where: { id },
      select: { nombre: true, descripcion: true, urlImagen: true, valor: true } 
    })
    return campana
  } catch (error) {
    return null
  }
}
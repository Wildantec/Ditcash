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
    // 1. Obtenemos los premios de esta campaña para saber si tienen canjes
    const premios = await prisma.premio.findMany({
      where: { 
        // Si tus premios NO tienen campanaId directamente, 
        // Prisma se quejará. Aquí asumimos la relación lógica.
      },
      select: { id: true }
    });

    const premioIds = premios.map((p:any) => p.id);

    // 2. EJECUTAMOS TODO EN UNA TRANSACCIÓN PARA EVITAR ERRORES
    await prisma.$transaction(async (tx:any) => {
      
      // A. Borrar Canjes asociados a los premios (si existen)
      if (premioIds.length > 0) {
        await tx.canje.deleteMany({
          where: { premioId: { in: premioIds } }
        });
      }

      // B. Borrar todas las evidencias de la campaña
      await tx.evidencia.deleteMany({
        where: { campanaId: id }
      });
      
      // D. Finalmente, borrar la campaña
      await tx.campana.delete({
        where: { id }
      });
    });

    revalidatePath('/dashboard/admin/campanas');
    revalidatePath('/dashboard/vendedor');
    
    return { success: true };
  } catch (error: any) {
    console.error("ERROR AL ELIMINAR CAMPAÑA:", error);
    return { 
      error: "No se pudo eliminar: Hay datos protegidos. Intenta borrar primero los premios asociados manualmente." 
    };
  }
}

// 4. CREAR CAMPAÑA (ACTUALIZADO CON VALOR)
export async function createCampana(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const detalle = formData.get('detalle') as string
    const fechaInicio = formData.get('fecha_inicio') as string
    const fechaFin = formData.get('fecha_cierre') as string
    const estado = formData.get('estado') as string
    const valor = formData.get('valor') as string // <--- CAPTURAMOS EL VALOR
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
        descripcion: detalle,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        activa: estado === 'Activa',
        urlImagen: urlImagen,
        valor: parseFloat(valor) || 0 // <--- GUARDAMOS EL VALOR EN LA BD
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

// 6. ACTUALIZAR CAMPAÑA (Versión Blindada)
export async function updateCampana(id: number, data: any) {
  try {
    // Validamos que el ID sea correcto
    if (!id) throw new Error("ID de campaña no proporcionado");

    await prisma.campana.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.detalle, // Mapeamos 'detalle' del formulario a 'descripcion' de la BD
        // Validamos y convertimos las fechas
        fechaInicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
        fechaFin: data.fecha_cierre ? new Date(data.fecha_cierre) : undefined,
        // Convertimos el estado a boolean
        activa: data.estado === 'Activa',
        // Convertimos el valor a Float de Prisma (número decimal)
        valor: parseFloat(data.valor) || 0,
        ...(data.urlImagen && { urlImagen: data.urlImagen })
      }
    })

    revalidatePath('/dashboard/admin/campanas')
    revalidatePath(`/dashboard/admin/campanas/editar/${id}`)
    
    return { success: true }
  } catch (error: any) {
    console.error("ERROR PRISMA UPDATE:", error);
    // Devolvemos el error específico para que sepas qué pasó
    return { error: `Error en BD: ${error.message || "No se pudo actualizar"}` }
  }
}

// 7. CONSULTA PÚBLICA (LIGERA)
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
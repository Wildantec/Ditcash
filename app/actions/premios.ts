'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'

cloudinary.config({
  cloud_name: "dtoatm1sc",
  api_key: "498872921383927",
  api_secret: "xUkKG2gTUl7khw9K8lOoe1GwI74",
  secure: true
});

// FUNCIÓN PARA SUBIR A CLOUDINARY
async function uploadToCloudinary(buffer: Buffer, folder: string) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder, 
        resource_type: 'image',
        quality: "auto:eco", 
        fetch_format: "auto" 
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

// --- ACCIONES DE ADMINISTRADOR ---

export async function crearPremioAction(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const puntos = parseFloat(formData.get('puntos') as string)
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File

    if (!file || file.size === 0) return { error: "La foto es obligatoria" }
    if (file.size > 10 * 1024 * 1024) return { error: "La imagen es demasiado pesada" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_premios')

    await prisma.premio.create({
      data: {
        nombre,
        puntos,
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        descripcion: descripcion || "",
        activo: true,
        reservado: false
      }
    })

    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error: any) {
    return { error: "Error al guardar el premio." }
  }
}

export async function actualizarPremioAction(id: number, formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const puntos = parseFloat(formData.get('puntos') as string)
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File
    
    const premioActual = await prisma.premio.findUnique({ where: { id } })
    if (!premioActual) return { error: "Premio no encontrado" }

    let nuevaUrl = premioActual.urlImagen
    let nuevoPublicId = premioActual.publicId

    if (file && file.size > 0) {
      if (premioActual.publicId) await cloudinary.uploader.destroy(premioActual.publicId)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadResponse: any = await uploadToCloudinary(buffer, 'ditcash_premios')
      nuevaUrl = uploadResponse.secure_url
      nuevoPublicId = uploadResponse.public_id
    }

    await prisma.premio.update({
      where: { id },
      data: { nombre, puntos, descripcion, urlImagen: nuevaUrl, publicId: nuevoPublicId }
    })

    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error) {
    return { error: "No se pudo actualizar el premio" }
  }
}

// --- NUEVA: OBTENER SOLICITUDES DE CANJE (Para el Admin) ---
export async function getSolicitudesCanje() {
  try {
    return await prisma.canje.findMany({
      where: { estado: 'pendiente' },
      include: {
        vendedor: true,
        premio: true
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    return []
  }
}

// --- NUEVA: APROBAR CANJE (Para el Admin) ---
export async function gestionarCanjeAction(canjeId: number, aprobado: boolean) {
  try {
    const canje = await prisma.canje.findUnique({
      where: { id: canjeId },
      include: { premio: true, vendedor: true }
    })

    if (!canje) return { error: "Canje no encontrado" }

    if (aprobado) {
      // Si se aprueba: El premio queda inactivo definitivamente y el canje aprobado
      await prisma.$transaction([
        prisma.canje.update({ where: { id: canjeId }, data: { estado: 'aprobado' } }),
        prisma.premio.update({ where: { id: canje.premioId }, data: { activo: false } })
      ])
    } else {
      // Si se rechaza: El premio vuelve a estar disponible (no reservado)
      await prisma.$transaction([
        prisma.canje.update({ where: { id: canjeId }, data: { estado: 'rechazado' } }),
        prisma.premio.update({ where: { id: canje.premioId }, data: { reservado: false } })
      ])
    }

    revalidatePath('/dashboard/admin/premios')
    revalidatePath('/dashboard/vendedor/premios')
    return { success: true }
  } catch (error) {
    return { error: "Error al gestionar el canje" }
  }
}

// --- ACCIONES DE VENDEDOR ---

export async function solicitarCanjeAction(premioId: number) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { error: "Sesión no encontrada" }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { error: "Vendedor no encontrado" }

    // Verificar si ya fue reservado mientras el usuario veía la página
    const premio = await prisma.premio.findUnique({ where: { id: premioId } })
    if (premio?.reservado) return { error: "Este premio ya ha sido solicitado por otro usuario." }

    await prisma.$transaction([
      prisma.canje.create({
        data: { vendedorId: vendedor.id, premioId: premioId, estado: 'pendiente' }
      }),
      prisma.premio.update({
        where: { id: premioId },
        data: { reservado: true }
      })
    ])

    revalidatePath('/dashboard/vendedor/premios')
    return { success: true }
  } catch (error) {
    return { error: "No se pudo procesar la solicitud" }
  }
}

export async function getPremios() {
  try {
    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' }
    })
    return premios.map((p: any )=> ({ ...p, puntos: Number(p.puntos) }))
  } catch (error) {
    return []
  }
}

export async function eliminarPremioAction(id: number) {
  try {
    const premio = await prisma.premio.findUnique({ where: { id } })
    if (premio?.publicId) await cloudinary.uploader.destroy(premio.publicId)
    await prisma.premio.delete({ where: { id } })
    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error) {
    return { success: false, error: "No se pudo eliminar" }
  }
}
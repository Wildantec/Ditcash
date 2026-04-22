'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: "dtoatm1sc",
  api_key: "498872921383927",
  api_secret: "xUkKG2gTUl7khw9K8lOoe1GwI74",
  secure: true
});

export async function crearPremioAction(formData: FormData) {
  try {
    const nombre = formData.get('nombre') as string
    const puntos = parseFloat(formData.get('puntos') as string)
    const descripcion = formData.get('descripcion') as string
    const file = formData.get('foto') as File

    if (!file || file.size === 0) return { error: "La foto es obligatoria" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ditcash_premios', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    if (!uploadResponse?.secure_url) {
        throw new Error("No se obtuvo URL de Cloudinary");
    }

    await prisma.premio.create({
      data: {
        nombre,
        puntos,
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        descripcion: descripcion || "",
        activo: true
      }
    })

    revalidatePath('/dashboard/admin/premios')
    return { success: true }
  } catch (error: any) {
    console.error("Error en servidor:", error)
    return { error: "Error crítico al guardar. Revisa el tamaño de la imagen." }
  }
}

export async function getPremios() {
  try {
    const premios = await prisma.premio.findMany({
      where: { activo: true },
      orderBy: { id: 'desc' }
    })
    return premios.map(p => ({ ...p, puntos: Number(p.puntos) }))
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
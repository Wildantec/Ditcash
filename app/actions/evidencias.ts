'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'

// CONFIGURACIÓN CON TIMEOUT EXTENDIDO
cloudinary.config({
  cloud_name: "dtoatm1sc",
  api_key: "498872921383927",
  api_secret: "xUkKG2gTUl7khw9K8lOoe1GwI74",
  secure: true
});

/**
 * REGISTRA EVIDENCIA: Versión por Base64 para evitar Timeout 499
 */
export async function registrarEvidenciaAction(formData: FormData, campanaId: string) {
  try {
    const file = formData.get('foto') as File
    const clienteNombre = formData.get('cliente_nombre') as string
    
    // 1. OBTENER EL VENDEDOR REAL DESDE LA SESIÓN (Cookies)
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { error: "No se encontró la sesión del usuario." }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { error: "Vendedor no encontrado." }

    if (!file || file.size === 0) return { error: "La foto es obligatoria." }

    // 2. GENERAR HASH
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')

    // 3. VALIDACIÓN DE DUPLICADO
    const duplicado = await prisma.evidencia.findUnique({
      where: { imageHash: hash }
    })

    if (duplicado) {
      return { 
        error: "FRAUDE DETECTADO: Esta imagen ya ha sido utilizada anteriormente." 
      }
    }

    // 4. SUBIR A CLOUDINARY
    const uploadResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ditcash_evidencias' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    // 5. GUARDAR CON EL ID CORRECTO
    await prisma.evidencia.create({
      data: {
        clienteNombre,
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        vendedorId: vendedor.id, // <--- CAMBIADO: Ahora usa el ID real del logueado
        campanaId: parseInt(campanaId),
        estado: 'pendiente',
        imageHash: hash 
      }
    })

    revalidatePath(`/dashboard/vendedor/campanas/${campanaId}`)
    return { success: true }

  } catch (error) {
    console.error("Error al registrar evidencia:", error)
    return { error: "Hubo un problema al procesar la imagen." }
  }
}

/**
 * REVISIÓN DEL ADMIN (Aprobar/Rechazar)
 */
export async function revisarEvidenciaAction(id: number, aprobado: boolean, motivo?: string) {
  try {
    const evidencia = await prisma.evidencia.findUnique({
      where: { id },
      include: { vendedor: true }
    })

    if (!evidencia || evidencia.estado !== 'pendiente') return { error: "No procesable" }

    if (aprobado) {
      await prisma.$transaction([
        prisma.evidencia.update({ where: { id }, data: { estado: 'aprobado' } }),
        prisma.vendedor.update({
          where: { id: evidencia.vendedorId },
          data: { puntosAcumulados: { increment: evidencia.valorPagado } }
        })
      ])
    } else {
      await prisma.evidencia.update({
        where: { id },
        data: { estado: 'rechazado', motivoRechazo: motivo || "No cumple requisitos" }
      })
    }

    revalidatePath('/dashboard/admin/vendedores')
    return { success: true }
  } catch (error) {
    return { error: "Error en la revisión" }
  }
}

/**
 * GET HISTORIAL VENDEDOR
 */
export async function getHistorialVendedor() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return []

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return []

    const campanas = await prisma.campana.findMany({
      orderBy: { fechaInicio: 'desc' }
    })

    const evidencias = await prisma.evidencia.findMany({
      where: { vendedorId: vendedor.id }
    })

    return campanas.map(c => {
      // AQUÍ ESTÁ EL CAMBIO: Filtramos por campanaId Y por estado 'aprobado'
      const aprobadas = evidencias.filter(e => 
        e.campanaId === c.id && e.estado === 'aprobado'
      )
      
      const total = aprobadas.length * 2 // Solo suma las aprobadas

      return {
        id: c.id,
        nombre: c.nombre,
        fecha_inicio: c.fechaInicio.toLocaleDateString(),
        fecha_cierre: c.fechaFin.toLocaleDateString(),
        estado: c.activa ? 'Activa' : 'Finalizada',
        total_acumulado: total,
        // Opcional: puedes poner "Pendiente" si hay fotos pero no aprobadas
        puesto: total > 0 ? "Registrado" : "Sin actividad"
      }
    })
  } catch (error) {
    console.error("Error en historial:", error)
    return []
  }
}

/**
 * GET MIS EVIDENCIAS (Vendedor)
 */
export async function getMisEvidencias(campanaId: number) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    const vendedor = await prisma.vendedor.findUnique({ where: { usuarioId: parseInt(userId!) } })
    if (!vendedor) return []

    const data = await prisma.evidencia.findMany({
      where: { vendedorId: vendedor.id, campanaId },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(e => ({
      ...e,
      valorPagado: Number(e.valorPagado),
      createdAt: e.createdAt.toISOString()
    }))
  } catch (error) { return [] }
}

/**
 * GET EVIDENCIAS BY VENDEDOR (Admin)
 */
export async function getEvidenciasByVendedor(vendedorId: number) {
  try {
    const data = await prisma.evidencia.findMany({
      where: { vendedorId: parseInt(vendedorId.toString()) },
      include: { campana: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return data.map(e => ({
      ...e,
      valorPagado: Number(e.valorPagado),
      createdAt: e.createdAt.toISOString()
    }))
  } catch (error) { return [] }
}

/**
 * ELIMINAR EVIDENCIA
 */
export async function eliminarEvidenciaAction(id: number) {
  try {
    await prisma.evidencia.delete({ where: { id } })
    revalidatePath('/dashboard/admin/vendedores')
    return { success: true }
  } catch (error) { return { error: "Error al eliminar" } }
}
'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function registrarEvidenciaAction(formData: FormData, campanaId: string) {
  try {
    const file = formData.get('foto') as File
    const clienteNombre = formData.get('cliente_nombre') as string
    
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { error: "No se encontró la sesión del usuario." }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { error: "Vendedor no encontrado." }

    const campana = await prisma.campana.findUnique({
        where: { id: parseInt(campanaId) }
    })
    if (!campana) return { error: "Campaña no encontrada." }

    if (!file || file.size === 0) return { error: "La foto es obligatoria." }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    const duplicado = await prisma.evidencia.findUnique({
      where: { imageHash: hash }
    })

    if (duplicado) {
      return { error: "ESTA IMAGEN YA FUE SUBIDA: Por favor toma una foto nueva de la gestión." }
    }
    const uploadResponse: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'ditcash_evidencias',
          resource_type: 'image',
          quality: "auto:good",
          fetch_format: "auto"
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })
    await prisma.evidencia.create({
      data: {
        clienteNombre,
        urlImagen: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        vendedorId: vendedor.id,
        campanaId: parseInt(campanaId),
        estado: 'pendiente',
        imageHash: hash,
        valorPagado: campana.valor 
      }
    })

    revalidatePath(`/dashboard/vendedor/campanas/${campanaId}`)
    return { success: true }

  } catch (error) {
    return { error: "Error de conexión: La imagen es muy pesada o el internet es inestable." }
  }
}
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
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/vendedores')
    revalidatePath('/dashboard/campanas')
    return { success: true }
  } catch (error) {
    return { error: "Error en la revisión" }
  }
}
export async function getHistorialVendedor() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return { campanas: [], saldoDisponible: 0 }

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })
    if (!vendedor) return { campanas: [], saldoDisponible: 0 }

    const saldoNetoReal = (Number(vendedor.puntosAcumulados) || 0) - (Number(vendedor.saldoGastado) || 0);

    const campanas = await prisma.campana.findMany({
      orderBy: { fechaInicio: 'desc' }
    })

    const evidencias = await prisma.evidencia.findMany({
      where: { vendedorId: vendedor.id }
    })

    const listaCampanas = campanas.map((c: any) => {
      const aprobadas = evidencias.filter((e: any) => 
        e.campanaId === c.id && e.estado === 'aprobado'
      )
      
      const total = aprobadas.reduce((sum: any, e: any) => sum + (Number(e.valorPagado) || 0), 0)

      return {
        id: c.id,
        nombre: c.nombre,
        fecha_inicio: c.fechaInicio.toLocaleDateString(),
        fecha_cierre: c.fechaFin.toLocaleDateString(),
        estado: c.activa ? 'Activa' : 'Finalizada',
        total_acumulado: total,
        puesto: total > 0 ? "Registrado" : "Sin actividad"
      }
    })

    return {
      campanas: listaCampanas,
      saldoDisponible: saldoNetoReal
    }
  } catch (error) {
    return { campanas: [], saldoDisponible: 0 }
  }
}

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

    return data.map((e:any) => ({
      ...e,
      valorPagado: Number(e.valorPagado),
      createdAt: e.createdAt.toISOString()
    }))
  } catch (error) { return [] }
}

export async function getEvidenciasByVendedor(vendedorId: number) {
  try {
    const data = await prisma.evidencia.findMany({
      where: { vendedorId: parseInt(vendedorId.toString()) },
      include: { campana: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return data.map((e:any) => ({
      ...e,
      valorPagado: Number(e.valorPagado),
      createdAt: e.createdAt.toISOString()
    }))
  } catch (error) { return [] }
}

export async function eliminarEvidenciaAction(id: number) {
  try {
    await prisma.evidencia.delete({ where: { id } })
    revalidatePath('/dashboard/admin/vendedores')
    return { success: true }
  } catch (error) { return { error: "Error al eliminar" } }
}
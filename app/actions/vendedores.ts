'use server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'

// Configuración robusta
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function getVendedorByUsuarioId(usuarioId: number) {
  try {
    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: usuarioId }
    })
    return vendedor
  } catch (error) {
    return null
  }
}

export async function getSaldoVendedorAction() {
  try {
    const cookieStore = await cookies()
    const userIdRaw = cookieStore.get('user_id')?.value

    if (!userIdRaw) return 0

    const userId = parseInt(userIdRaw)

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: userId },
      select: { id: true }
    })

    if (!vendedor) return 0

    const totalAprobadas = await prisma.evidencia.count({
      where: {
        vendedorId: vendedor.id,
        estado: 'aprobado'
      }
    })

    return totalAprobadas * 2

  } catch (error) {
    console.error("Error al obtener saldo del vendedor:", error)
    return 0
  }
}

// RANKING DE VENDEDORES CORREGIDO
export async function getVendedoresRanking() {
  try {
    // 1. Quitamos el filtro 'aprobado' del include para que traiga TODO
    const vendedoresRaw = await prisma.vendedor.findMany({
      include: {
        evidencias: true 
      }
    })

    // 2. Procesamos manualmente para separar puntos de pendientes
    const vendedoresProcesados = vendedoresRaw.map(v => {
      // Solo sumamos los puntos de las que están aprobadas
      const aprobadas = v.evidencias.filter(e => e.estado === 'aprobado');
      
      return {
        ...v,
        puntosAcumulados: aprobadas.length * 2,
        // Pasamos todas las evidencias (incluyendo pendientes) al frontend
        evidencias: v.evidencias 
      }
    })

    return vendedoresProcesados.sort((a, b) => b.puntosAcumulados - a.puntosAcumulados)
  } catch (error) {
    console.error("Error en ranking:", error)
    return []
  }
}
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

// SALDO DEL VENDEDOR (CORREGIDO PARA SER DINÁMICO)
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

    // Sumamos directamente los valores de la columna valorPagado de la BD
    const agregado = await prisma.evidencia.aggregate({
      where: {
        vendedorId: vendedor.id,
        estado: 'aprobado'
      },
      _sum: {
        valorPagado: true
      }
    })

    return agregado._sum.valorPagado || 0

  } catch (error) {
    console.error("Error al obtener saldo del vendedor:", error)
    return 0
  }
}

// RANKING DE VENDEDORES (CORREGIDO PARA USAR SUMA REAL)
export async function getVendedoresRanking() {
  try {
    const vendedoresRaw = await prisma.vendedor.findMany({
      include: {
        evidencias: true 
      }
    })

    const vendedoresProcesados = vendedoresRaw.map((v:any) => {
      // Sumamos el valorPagado real de cada evidencia aprobada
      const puntosReales = v.evidencias
        .filter((e:any) => e.estado === 'aprobado')
        .reduce((acc:any, curr:any) => acc + (Number(curr.valorPagado) || 0), 0);
      
      return {
        ...v,
        puntosAcumulados: puntosReales,
        evidencias: v.evidencias 
      }
    })

    return vendedoresProcesados.sort((a:any, b:any) => b.puntosAcumulados - a.puntosAcumulados)
  } catch (error) {
    console.error("Error en ranking:", error)
    return []
  }
}
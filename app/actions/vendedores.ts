'use server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'

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
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return 0

    const vendedor = await prisma.vendedor.findUnique({
      where: { usuarioId: parseInt(userId) }
    })

    if (!vendedor) return 0
    const baseInyectada = Number(vendedor.puntosAcumulados || 0)
    const gastado = Number(vendedor.saldoGastado || 0)
    
    return baseInyectada - gastado
  } catch (error) {
    return 0
  }
}

export async function getVendedoresRanking() {
  try {
    const vendedoresRaw = await prisma.vendedor.findMany({
      include: {
        evidencias: true 
      }
    })

    const vendedoresProcesados = vendedoresRaw.map((v:any) => {
      const saldoDisponibleReal = Number(v.puntosAcumulados || 0) - Number(v.saldoGastado || 0);
      
      return {
        ...v,
        puntosAcumulados: saldoDisponibleReal,
        evidencias: v.evidencias 
      }
    })
    return vendedoresProcesados.sort((a:any, b:any) => b.puntosAcumulados - a.puntosAcumulados)
  } catch (error) {
    return []
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarFacturacion } from '@/lib/facturacion-auth'

export async function GET() {
  const respuestaAcceso = await autorizarFacturacion('ver')
  if (respuestaAcceso) return respuestaAcceso

  try {
    const vendedores = await prisma.vendedor.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }]
    })

    return NextResponse.json({ success: true, data: vendedores })
  } catch (error) {
    console.error('Error al cargar vendedores para facturación:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar los vendedores' }, { status: 500 })
  }
}

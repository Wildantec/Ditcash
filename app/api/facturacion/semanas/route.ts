import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarFacturacion } from '@/lib/facturacion-auth'

function parsearFecha(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const fecha = new Date(`${value}T12:00:00.000Z`)
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== value
    ? null
    : fecha
}

export async function GET() {
  const respuestaAcceso = await autorizarFacturacion('ver')
  if (respuestaAcceso) return respuestaAcceso

  try {
    const semanas = await prisma.semanaComercial.findMany({
      orderBy: { fechaInicio: 'desc' }
    })
    return NextResponse.json({ success: true, data: semanas })
  } catch (error) {
    console.error('Error al cargar semanas comerciales:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar las semanas' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const respuestaAcceso = await autorizarFacturacion('crear')
  if (respuestaAcceso) return respuestaAcceso

  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos de semana inválidos' }, { status: 400 })
    }

    const datos = body as Record<string, unknown>
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    const mes = typeof datos.mes === 'string' ? datos.mes.trim() : null
    const fechaInicio = parsearFecha(datos.fechaInicio)
    const fechaFin = parsearFecha(datos.fechaFin)

    if (!nombre || nombre.length > 120 || !fechaInicio || !fechaFin) {
      return NextResponse.json({ success: false, error: 'Completa correctamente el nombre y las fechas de la semana' }, { status: 400 })
    }
    if (mes && mes.length > 40) {
      return NextResponse.json({ success: false, error: 'El mes comercial no es válido' }, { status: 400 })
    }
    if (fechaInicio > fechaFin) {
      return NextResponse.json({ success: false, error: 'La fecha de inicio no puede ser mayor a la de fin' }, { status: 400 })
    }

    const semanaTraslapada = await prisma.semanaComercial.findFirst({
      where: {
        fechaInicio: { lte: fechaFin },
        fechaFin: { gte: fechaInicio }
      },
      select: { nombre: true }
    })

    if (semanaTraslapada) {
      return NextResponse.json({
        success: false,
        error: `Estas fechas coinciden con la semana ya existente "${semanaTraslapada.nombre}".`
      }, { status: 400 })
    }

    const nuevaSemana = await prisma.semanaComercial.create({
      data: { nombre, mes, fechaInicio, fechaFin }
    })

    return NextResponse.json({ success: true, data: nuevaSemana })
  } catch (error) {
    console.error('Error al crear semana comercial:', error)
    return NextResponse.json({ success: false, error: 'Error al crear la semana comercial' }, { status: 500 })
  }
}

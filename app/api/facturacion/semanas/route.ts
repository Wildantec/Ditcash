import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUserHasPermission } from '@/lib/authorization'

export async function GET() {
  try {
    if (!await currentUserHasPermission('facturacion', 'ver')) {
      return NextResponse.json({ success: false, error: 'Acceso denegado.' }, { status: 403 })
    }

    const semanas = await prisma.semanaComercial.findMany({
      orderBy: { fechaInicio: 'desc' }
    })
    return NextResponse.json({ success: true, data: semanas })
  } catch (error) {
    console.error('Error al cargar las semanas comerciales:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar las semanas.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!await currentUserHasPermission('facturacion', 'crear')) {
      return NextResponse.json({ success: false, error: 'No tienes permiso para crear semanas.' }, { status: 403 })
    }

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Los datos de la semana no son válidos.' }, { status: 400 })
    }

    const data = body as Record<string, unknown>
    const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : ''
    const fechaInicioTexto = typeof data.fechaInicio === 'string' ? data.fechaInicio : ''
    const fechaFinTexto = typeof data.fechaFin === 'string' ? data.fechaFin : ''
    const mes = typeof data.mes === 'string' ? data.mes.trim() : null
    if (!nombre || !fechaInicioTexto || !fechaFinTexto) {
      return NextResponse.json({ success: false, error: 'Completa el nombre y las fechas de la semana.' }, { status: 400 })
    }
    if (nombre.length > 120 || (mes && mes.length > 40)) {
      return NextResponse.json({ success: false, error: 'El nombre o el mes comercial supera la longitud permitida.' }, { status: 400 })
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(fechaInicioTexto) || !datePattern.test(fechaFinTexto)) {
      return NextResponse.json({ success: false, error: 'El formato de fecha no es válido.' }, { status: 400 })
    }

    const fechaInicio = new Date(`${fechaInicioTexto}T12:00:00.000Z`)
    const fechaFin = new Date(`${fechaFinTexto}T12:00:00.000Z`)
    if (
      Number.isNaN(fechaInicio.getTime()) ||
      Number.isNaN(fechaFin.getTime()) ||
      fechaInicio.toISOString().slice(0, 10) !== fechaInicioTexto ||
      fechaFin.toISOString().slice(0, 10) !== fechaFinTexto
    ) {
      return NextResponse.json({ success: false, error: 'Las fechas ingresadas no son válidas.' }, { status: 400 })
    }
    if (fechaInicio > fechaFin) {
      return NextResponse.json({ success: false, error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }, { status: 400 })
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
        error: `Las fechas se cruzan con la semana "${semanaTraslapada.nombre}".`
      }, { status: 409 })
    }

    const semana = await prisma.semanaComercial.create({
      data: { nombre, mes: mes || null, fechaInicio, fechaFin }
    })
    return NextResponse.json({ success: true, data: semana }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: 'El cuerpo de la solicitud no contiene JSON válido.' }, { status: 400 })
    }
    console.error('Error al crear la semana comercial:', error)
    return NextResponse.json({ success: false, error: 'Error al crear la semana comercial.' }, { status: 500 })
  }
}

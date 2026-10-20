import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'

export async function GET(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!userHasPermission(usuario, 'facturacion', 'ver')) {
      return NextResponse.json({ success: false, error: 'Acceso denegado.' }, { status: 403 })
    }

    const semanaIdTexto = new URL(request.url).searchParams.get('semanaId')
    let semanaId: number | undefined
    if (semanaIdTexto !== null) {
      semanaId = Number(semanaIdTexto)
      if (!Number.isSafeInteger(semanaId) || semanaId <= 0) {
        return NextResponse.json({ success: false, error: 'El identificador de semana no es válido.' }, { status: 400 })
      }
    }

    const evaluaciones = await prisma.evaluacionVendedor.findMany({
      where: semanaId === undefined ? {} : { semanaId },
      include: {
        vendedor: { select: { id: true, nombre: true, apellido: true } },
        semana: true
      },
      orderBy: { vendedor: { nombre: 'asc' } }
    })
    return NextResponse.json({ success: true, data: evaluaciones })
  } catch (error) {
    console.error('Error al cargar las evaluaciones de facturación:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar las evaluaciones.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario) {
      return NextResponse.json({ success: false, error: 'Debes iniciar sesión.' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Los datos de evaluación no son válidos.' }, { status: 400 })
    }

    const data = body as Record<string, unknown>
    const semanaId = Number(data.semanaId)
    const vendedorId = Number(data.vendedorId)
    const numContratos = Number(data.numContratos)
    const totalVentas = Number(data.totalVentas)
    const booleanFields = ['contratosFisicos', 'infoCompleta', 'requisitos', 'entregaMercaderia', 'superEstrella'] as const

    if (
      !Number.isSafeInteger(semanaId) || semanaId <= 0 ||
      semanaId > 2147483647 ||
      !Number.isSafeInteger(vendedorId) || vendedorId <= 0 || vendedorId > 2147483647 ||
      !Number.isSafeInteger(numContratos) || numContratos < 0 || numContratos > 2147483647 ||
      !Number.isFinite(totalVentas) || totalVentas < 0 ||
      !booleanFields.every((field) => typeof data[field] === 'boolean') ||
      (data.observacion !== undefined && data.observacion !== null && typeof data.observacion !== 'string') ||
      (typeof data.observacion === 'string' && data.observacion.length > 5000)
    ) {
      return NextResponse.json({ success: false, error: 'Revisa los valores de la evaluación.' }, { status: 400 })
    }

    if (numContratos > 0 && totalVentas === 0) {
      return NextResponse.json({ success: false, error: 'Si registras contratos, el total de ventas no puede ser $0.' }, { status: 400 })
    }

    const observacionTexto = typeof data.observacion === 'string' ? data.observacion.trim() : ''
    const cumplioCalidad = data.contratosFisicos && data.infoCompleta && data.requisitos && data.entregaMercaderia
    if (numContratos > 0 && !cumplioCalidad && !observacionTexto) {
      return NextResponse.json({
        success: false,
        error: 'La calidad no se cumplió: escribe una observación que explique por qué no obtiene la estrella.'
      }, { status: 400 })
    }

    const semanaExiste = await prisma.semanaComercial.findUnique({ where: { id: semanaId }, select: { id: true } })
    if (!semanaExiste) {
      return NextResponse.json({ success: false, error: 'La semana seleccionada ya no existe.' }, { status: 404 })
    }
    const vendedorExiste = await prisma.vendedor.findUnique({ where: { id: vendedorId }, select: { id: true, activo: true } })
    if (!vendedorExiste || !vendedorExiste.activo) {
      return NextResponse.json({ success: false, error: 'El vendedor seleccionado no existe o está inactivo.' }, { status: 404 })
    }

    const evaluacion = await prisma.$transaction(async (transaction) => {
      const existente = await transaction.evaluacionVendedor.findUnique({
        where: { semanaId_vendedorId: { semanaId, vendedorId } },
        select: { id: true }
      })
      const accion = existente ? 'editar' : 'crear'
      if (!userHasPermission(usuario, 'facturacion', accion)) {
        throw new Error(`PERMISSION_DENIED:${accion}`)
      }

      const values = {
        numContratos: numContratos === 0 ? 0 : numContratos,
        totalVentas: numContratos === 0 ? 0 : totalVentas,
        contratosFisicos: numContratos > 0 && data.contratosFisicos === true,
        infoCompleta: numContratos > 0 && data.infoCompleta === true,
        requisitos: numContratos > 0 && data.requisitos === true,
        entregaMercaderia: numContratos > 0 && data.entregaMercaderia === true,
        superEstrella: numContratos > 0 && data.superEstrella === true,
        observacion: numContratos === 0 ? null : (observacionTexto || null)
      }

      if (existente) {
        return transaction.evaluacionVendedor.update({
          where: { semanaId_vendedorId: { semanaId, vendedorId } },
          data: values
        })
      }
      return transaction.evaluacionVendedor.create({
        data: { semanaId, vendedorId, ...values }
      })
    })

    return NextResponse.json({ success: true, data: evaluacion })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: 'El cuerpo de la solicitud no contiene JSON válido.' }, { status: 400 })
    }
    if (error instanceof Error && error.message.startsWith('PERMISSION_DENIED:')) {
      return NextResponse.json({
        success: false,
        error: error.message.endsWith('crear')
          ? 'No tienes permiso para crear evaluaciones.'
          : 'No tienes permiso para editar evaluaciones.'
      }, { status: 403 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'La evaluación ya fue creada por otra solicitud. Recarga e inténtalo de nuevo.' }, { status: 409 })
    }
    console.error('Error al guardar la evaluación de facturación:', error)
    return NextResponse.json({ success: false, error: 'Error al guardar la evaluación.' }, { status: 500 })
  }
}

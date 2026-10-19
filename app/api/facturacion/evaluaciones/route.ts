import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autorizarFacturacion } from '@/lib/facturacion-auth'

function esValorNumerico(value: unknown): value is number | string {
  return (
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')
  ) && Number.isFinite(Number(value))
}

export async function GET(req: Request) {
  const respuestaAcceso = await autorizarFacturacion('ver')
  if (respuestaAcceso) return respuestaAcceso

  try {
    const { searchParams } = new URL(req.url)
    const semanaIdParam = searchParams.get('semanaId')
    let semanaId: number | undefined

    if (semanaIdParam !== null) {
      semanaId = Number(semanaIdParam)
      if (!Number.isSafeInteger(semanaId) || semanaId <= 0) {
        return NextResponse.json({ success: false, error: 'El identificador de semana no es válido' }, { status: 400 })
      }
    }

    const evaluaciones = await prisma.evaluacionVendedor.findMany({
      where: semanaId === undefined ? undefined : { semanaId },
      include: {
        vendedor: { select: { id: true, nombre: true, apellido: true } },
        semana: true
      },
      orderBy: [{ vendedor: { nombre: 'asc' } }, { vendedor: { apellido: 'asc' } }]
    })

    return NextResponse.json({ success: true, data: evaluaciones })
  } catch (error) {
    console.error('Error al cargar evaluaciones de facturación:', error)
    return NextResponse.json({ success: false, error: 'Error al cargar las evaluaciones' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Datos de evaluación inválidos' }, { status: 400 })
    }

    const datos = body as Record<string, unknown>
    if (
      !esValorNumerico(datos.semanaId) ||
      !esValorNumerico(datos.vendedorId) ||
      !esValorNumerico(datos.numContratos) ||
      !esValorNumerico(datos.totalVentas)
    ) {
      return NextResponse.json({ success: false, error: 'Semana, vendedor, contratos y ventas son obligatorios y deben ser numéricos' }, { status: 400 })
    }

    const semanaId = Number(datos.semanaId)
    const vendedorId = Number(datos.vendedorId)
    const numContratos = Number(datos.numContratos)
    let totalVentas = Number(datos.totalVentas)

    if (
      !Number.isSafeInteger(semanaId) || semanaId <= 0 ||
      !Number.isSafeInteger(vendedorId) || vendedorId <= 0
    ) {
      return NextResponse.json({ success: false, error: 'La semana o el vendedor no son válidos' }, { status: 400 })
    }
    if (!Number.isSafeInteger(numContratos) || !Number.isFinite(totalVentas)) {
      return NextResponse.json({ success: false, error: 'Contratos y ventas deben ser valores numéricos válidos' }, { status: 400 })
    }
    if (numContratos < 0 || totalVentas < 0) {
      return NextResponse.json({ success: false, error: 'No se permiten valores negativos' }, { status: 400 })
    }

    const camposBooleanos = [
      'contratosFisicos',
      'infoCompleta',
      'requisitos',
      'entregaMercaderia',
      'superEstrella'
    ] as const
    if (camposBooleanos.some(campo => typeof datos[campo] !== 'boolean')) {
      return NextResponse.json({ success: false, error: 'Los criterios de evaluación deben ser booleanos' }, { status: 400 })
    }
    if (datos.observacion !== undefined && datos.observacion !== null && typeof datos.observacion !== 'string') {
      return NextResponse.json({ success: false, error: 'La observación no es válida' }, { status: 400 })
    }

    let contratosFisicos = datos.contratosFisicos as boolean
    let infoCompleta = datos.infoCompleta as boolean
    let requisitos = datos.requisitos as boolean
    let entregaMercaderia = datos.entregaMercaderia as boolean
    let superEstrella = datos.superEstrella as boolean
    let observacion = typeof datos.observacion === 'string' ? datos.observacion.trim() : ''

    if (numContratos > 0 && totalVentas === 0) {
      return NextResponse.json({ success: false, error: 'Si registraste contratos, el total de ventas no puede ser $0' }, { status: 400 })
    }
    if (numContratos === 0) {
      totalVentas = 0
      contratosFisicos = false
      infoCompleta = false
      requisitos = false
      entregaMercaderia = false
      superEstrella = false
      observacion = ''
    }

    const cumplioTodo = contratosFisicos && infoCompleta && requisitos && entregaMercaderia
    if (numContratos > 0 && !cumplioTodo && !observacion) {
      return NextResponse.json({
        success: false,
        error: 'Calidad fallida: escribe una observación explicando por qué no se lleva la estrella.'
      }, { status: 400 })
    }
    if (observacion.length > 5000) {
      return NextResponse.json({ success: false, error: 'La observación supera el máximo permitido' }, { status: 400 })
    }

    const [semana, vendedor] = await Promise.all([
      prisma.semanaComercial.findUnique({ where: { id: semanaId }, select: { id: true } }),
      prisma.vendedor.findUnique({ where: { id: vendedorId }, select: { id: true, activo: true } })
    ])
    if (!semana) {
      return NextResponse.json({ success: false, error: 'La semana comercial no existe' }, { status: 404 })
    }
    if (!vendedor || !vendedor.activo) {
      return NextResponse.json({ success: false, error: 'El vendedor no existe o está inactivo' }, { status: 404 })
    }

    const evaluacionExistente = await prisma.evaluacionVendedor.findUnique({
      where: { semanaId_vendedorId: { semanaId, vendedorId } },
      select: { id: true }
    })
    const respuestaAcceso = await autorizarFacturacion(evaluacionExistente ? 'editar' : 'crear')
    if (respuestaAcceso) return respuestaAcceso

    const evaluacion = await prisma.evaluacionVendedor.upsert({
      where: { semanaId_vendedorId: { semanaId, vendedorId } },
      update: {
        numContratos,
        totalVentas,
        contratosFisicos,
        infoCompleta,
        requisitos,
        entregaMercaderia,
        superEstrella,
        observacion: observacion || null
      },
      create: {
        semanaId,
        vendedorId,
        numContratos,
        totalVentas,
        contratosFisicos,
        infoCompleta,
        requisitos,
        entregaMercaderia,
        superEstrella,
        observacion: observacion || null
      }
    })

    return NextResponse.json({ success: true, data: evaluacion })
  } catch (error) {
    console.error('Error al guardar evaluación de facturación:', error)
    return NextResponse.json({ success: false, error: 'Error de servidor al guardar la evaluación' }, { status: 500 })
  }
}

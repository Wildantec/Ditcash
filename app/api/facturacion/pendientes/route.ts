import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasPermission } from '@/lib/authorization'
import { calificacionFacturacion, semanaFinalizada, validarPendiente } from '@/lib/facturacion-pendientes'

function respuestaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') return NextResponse.json({ success: false, error: 'La evaluación cambió mientras guardabas. Recarga e inténtalo de nuevo.' }, { status: 409 })
  if (error instanceof SyntaxError) return NextResponse.json({ success: false, error: 'Solicitud inválida.' }, { status: 400 })
  if (error instanceof Prisma.PrismaClientKnownRequestError) return NextResponse.json({ success: false, error: 'No se pudo guardar el pendiente.' }, { status: 500 })
  return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo guardar el pendiente.' }, { status: 400 })
}

export async function POST(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || !userHasPermission(usuario, 'facturacion', 'editar')) return NextResponse.json({ success: false, error: 'No tienes permiso para editar facturación.' }, { status: 403 })
    const body = await request.json()
    if (!body || typeof body !== 'object') throw new Error('Solicitud inválida.')
    const datos = validarPendiente(body)
    await prisma.$transaction(async tx => {
      const evaluacion = await tx.evaluacionVendedor.findUnique({ where: { id: datos.evaluacionId }, include: { semana: true, pendientes: true, vendedor: true } })
      if (!evaluacion) throw new Error('Guarda primero la evaluación de esta semana.')
      if (!evaluacion.vendedor.activo) throw new Error('El vendedor está inactivo.')
      await tx.pendienteFacturacion.create({ data: { ...datos, creadoPor: usuario.nombre || usuario.username } })
      await tx.evaluacionVendedor.update({ where: { id: evaluacion.id }, data: {
        revision: { increment: 1 },
        ...(semanaFinalizada(evaluacion.semana.fechaFin) ? { calificacionCierre: calificacionFacturacion(evaluacion) } : {})
      } })
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ success: true })
  } catch (error) { return respuestaError(error) }
}

export async function PATCH(request: Request) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario || !userHasPermission(usuario, 'facturacion', 'editar')) return NextResponse.json({ success: false, error: 'No tienes permiso para editar facturación.' }, { status: 403 })
    const body = await request.json()
    const id = Number(body?.id)
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('El pendiente no es válido.')
    await prisma.$transaction(async tx => {
      const pendiente = await tx.pendienteFacturacion.findUnique({ where: { id }, include: { evaluacion: { include: { semana: true, pendientes: true } } } })
      if (!pendiente) throw new Error('Pendiente no encontrado.')
      if (pendiente.regularizadoEn) return
      const evaluacion = pendiente.evaluacion
      if (evaluacion.numContratos + pendiente.cantidad > 2147483647 || evaluacion.totalVentas + Number(pendiente.valor) >= 1e12) throw new Error('El total supera el límite permitido.')
      const tomado = await tx.pendienteFacturacion.updateMany({ where: { id, regularizadoEn: null }, data: { regularizadoEn: new Date(), regularizadoPor: usuario.nombre || usuario.username } })
      if (!tomado.count) return
      await tx.evaluacionVendedor.update({ where: { id: evaluacion.id }, data: {
        numContratos: { increment: pendiente.cantidad },
        totalVentas: Math.round((evaluacion.totalVentas + Number(pendiente.valor)) * 100) / 100,
        revision: { increment: 1 },
        ...(semanaFinalizada(evaluacion.semana.fechaFin) ? { calificacionCierre: calificacionFacturacion(evaluacion) } : {})
      } })
    }, { isolationLevel: 'Serializable' })
    return NextResponse.json({ success: true })
  } catch (error) { return respuestaError(error) }
}

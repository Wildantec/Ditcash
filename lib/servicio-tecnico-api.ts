import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, userHasPermission, AccionPermiso } from '@/lib/authorization'

type Recurso = 'meses' | 'equipos' | 'reparaciones'
class DatosServicioTecnicoInvalidos extends Error {}
function exigir(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new DatosServicioTecnicoInvalidos(mensaje)
}
function idValido(valor: unknown) {
  const id = Number(valor)
  exigir(Number.isSafeInteger(id) && id > 0, 'Identificador inválido')
  return id
}
function dinero(valor: unknown) {
  exigir(valor !== null && valor !== undefined && valor !== '' && (typeof valor === 'number' || typeof valor === 'string'), 'Importe inválido')
  const numero = Number(valor)
  exigir(Number.isFinite(numero) && numero >= 0 && numero <= 999999999, 'El importe debe ser válido y no negativo')
  return Math.round(numero * 100) / 100
}
function texto(valor: unknown, obligatorio = false, maximo = 191) {
  exigir(typeof valor === 'string' && valor.trim().length <= maximo && (!obligatorio || valor.trim().length > 0), 'Texto vacío o demasiado largo')
  return valor.trim()
}
export async function servicioTecnicoAPI(req: Request, recurso: Recurso) {
  try {
    const usuario = await getCurrentUser()
    if (!usuario) return NextResponse.json({ success: false, error: 'Sesión requerida' }, { status: 401 })
    if (!userHasPermission(usuario, 'servicio_tecnico', 'ver')) return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 })
    const metodo = req.method
    if (metodo === 'GET') {
      const data = recurso === 'meses' ? await prisma.mesServicioTecnico.findMany({ orderBy: { mesAnio: 'desc' } })
        : recurso === 'equipos' ? await prisma.equipoServicioTecnico.findMany({ orderBy: { nombre: 'asc' } })
        : await prisma.reparacionServicioTecnico.findMany({ include: { equipo: true, mes: true }, orderBy: { fecha: 'desc' } })
      return NextResponse.json({ success: true, data })
    }
    const body = metodo === 'DELETE' ? {} : await req.json()
    const accion: AccionPermiso = metodo === 'DELETE' ? 'eliminar' : metodo === 'PATCH' || (recurso === 'reparaciones' && body.id) ? 'editar' : 'crear'
    if (!userHasPermission(usuario, 'servicio_tecnico', accion)) return NextResponse.json({ success: false, error: 'Sin permiso para esta operación' }, { status: 403 })
    const data = await prisma.$transaction(async tx => {
      if (recurso === 'equipos') {
        if (metodo === 'DELETE') return tx.equipoServicioTecnico.update({ where: { id: idValido(new URL(req.url).searchParams.get('id')) }, data: { habilitado: false } })
        const nombre = texto(body.nombre, true).toUpperCase()
        if (metodo === 'PATCH') return tx.equipoServicioTecnico.update({ where: { id: idValido(body.id) }, data: { nombre } })
        return tx.equipoServicioTecnico.upsert({ where: { nombre }, create: { nombre }, update: { habilitado: true } })
      }
      if (recurso === 'meses') {
        if (metodo === 'PATCH') {
          exigir(body.estado === undefined || ['ABIERTO', 'CERRADO'].includes(body.estado), 'Estado inválido')
          exigir(body.estado !== undefined || body.presupuesto !== undefined, 'No hay cambios')
          return tx.mesServicioTecnico.update({ where: { id: idValido(body.id) }, data: { ...(body.estado !== undefined ? { estado: body.estado } : {}), ...(body.presupuesto !== undefined ? { presupuesto: dinero(body.presupuesto) } : {}) } })
        }
        exigir(typeof body.mesAnio === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(body.mesAnio), 'Mes inválido')
        return tx.mesServicioTecnico.create({ data: { mesAnio: body.mesAnio, presupuesto: dinero(body.presupuesto) } })
      }
      if (metodo === 'DELETE') return tx.reparacionServicioTecnico.delete({ where: { id: idValido(new URL(req.url).searchParams.get('id')) } })
      const mesId = idValido(body.mesId)
      const mes = await tx.mesServicioTecnico.findUnique({ where: { id: mesId } })
      exigir(mes?.estado === 'ABIERTO', 'Reabre el mes antes de registrar o editar reparaciones')
      const anterior = body.id ? await tx.reparacionServicioTecnico.findUnique({ where: { id: idValido(body.id) } }) : null
      if (body.id) exigir(anterior && anterior.mesId === mesId, 'Edita la reparación dentro de su mes original')
      const equipoId = idValido(body.equipoId)
      const equipo = await tx.equipoServicioTecnico.findUnique({ where: { id: equipoId } })
      exigir(equipo && (equipo.habilitado || anterior?.equipoId === equipoId), 'Selecciona un producto habilitado')
      exigir(typeof body.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha), 'Fecha inválida')
      const fecha = new Date(body.fecha + 'T00:00:00.000Z')
      exigir(Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0,10) === body.fecha, 'Fecha inválida')
      const valorGastado = dinero(body.valorGastado)
      const valorRecuperado = dinero(body.valorRecuperado || 0)
      const resultadoNeto = Math.round((valorRecuperado - valorGastado) * 100) / 100
      const datos = { mesId, equipoId, fecha, cliente: texto(body.cliente, true), descripcion: texto(body.descripcion || '', false, 10000), comprobante: texto(body.comprobante || ''), valorGastado, valorRecuperado, resultadoNeto, estadoRentabilidad: resultadoNeto > 0 ? 'GANANCIA' : resultadoNeto < 0 ? 'PERDIDA' : 'EMPATE' }
      return anterior ? tx.reparacionServicioTecnico.update({ where: { id: anterior.id }, data: datos }) : tx.reparacionServicioTecnico.create({ data: datos })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Servicio técnico:', error)
    const mensajesPrisma: Record<string, string> = {
      P2002: 'El mes o producto ya existe',
      P2025: 'Registro no encontrado',
      P2034: 'Otra operación modificó estos datos. Vuelve a intentar.'
    }
    const mensajePrisma = error instanceof Prisma.PrismaClientKnownRequestError ? mensajesPrisma[error.code] : undefined
    const mensaje = error instanceof DatosServicioTecnicoInvalidos ? error.message
      : mensajePrisma || 'No se pudo completar la operación de Servicio Técnico. Intenta nuevamente.'
    const status = error instanceof DatosServicioTecnicoInvalidos || mensajePrisma ? 400 : 500
    return NextResponse.json({ success: false, error: mensaje }, { status })
  }
}

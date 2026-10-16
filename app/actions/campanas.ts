'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { tienePermiso, PermisoModulo } from '@/lib/permisos'


function parseFechaLocal(fechaStr: string | Date): Date {
  if (fechaStr instanceof Date) return fechaStr;
  
  if (typeof fechaStr === 'string' && fechaStr.includes('-')) {
    const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  
  return new Date(fechaStr);
}

async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return false

    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { role: true }
    })

    if (!usuario) return false

    const permisos = (usuario.role?.permisos as unknown as PermisoModulo[]) || []
    const rolNombre = usuario.role?.nombre || usuario.rol

    return tienePermiso(permisos, rolNombre, moduloId, accion)
  } catch (error) {
    return false
  }
}

function normalizarCampana(c: any) {
  if (!c) return null
  return {
    ...c,
    valor: c.valor ?? c.puntosOtorgados ?? 0,
    puntosOtorgados: c.valor ?? c.puntosOtorgados ?? 0,
    activa: c.activa ?? c.activo ?? true,
    activo: c.activa ?? c.activo ?? true
  }
}

export async function getCampanasAction() {
  try {
    const autorizado = await validarAccionSesion('campanas', 'ver')
    if (!autorizado) return []

    const campanas = await prisma.campana.findMany({
      orderBy: { id: 'desc' }
    })

    return campanas.map(normalizarCampana)
  } catch (error) {
    return []
  }
}

export async function getCampanas() {
  return await getCampanasAction()
}

export async function getCampanaByIdAction(id: number) {
  try {
    const autorizado = await validarAccionSesion('campanas', 'ver')
    if (!autorizado) return null

    const campana = await prisma.campana.findUnique({
      where: { id }
    })

    return normalizarCampana(campana)
  } catch (error) {
    return null
  }
}

export async function getCampanaById(id: number) {
  return await getCampanaByIdAction(id)
}

export async function crearCampanaAction(data: any) {
  try {
    const autorizado = await validarAccionSesion('campanas', 'crear')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR campañas.' }
    }

    const nombre = data.nombre?.trim().toUpperCase()
    if (!nombre) {
      return { success: false, error: 'El nombre de la campaña es obligatorio.' }
    }

    const fechaInicio = data.fechaInicio || data.fecha_inicio
    const fechaFin = data.fechaFin || data.fecha_cierre
    const descripcion = data.descripcion || data.detalle || ''
    const montoEvidencia = data.valor !== undefined ? Number(data.valor) : (data.puntosOtorgados !== undefined ? Number(data.puntosOtorgados) : 0)
    const esActiva = data.estado ? data.estado === 'Activa' : (data.activa !== undefined ? data.activa : (data.activo !== undefined ? data.activo : true))

    if (!fechaInicio || !fechaFin) {
      return { success: false, error: 'Las fechas de inicio y cierre son obligatorias.' }
    }

    await prisma.campana.create({
      data: {
        nombre,
        descripcion: descripcion.trim(),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        valor: montoEvidencia,
        activa: esActiva
      }
    })

    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Error al crear campaña: ${error.message}` }
  }
}

export async function createCampana(data: any) {
  return await crearCampanaAction(data)
}

export async function actualizarCampanaAction(id: number, data: any) {
  try {
    const autorizado = await validarAccionSesion('campanas', 'editar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR campañas.' }
    }

    const updateData: any = {}

    if (data.nombre) updateData.nombre = data.nombre.trim().toUpperCase()
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion.trim()
    if (data.detalle !== undefined) updateData.descripcion = data.detalle.trim()

    const fInicio = data.fechaInicio || data.fecha_inicio
    if (fInicio) updateData.fechaInicio = parseFechaLocal(fInicio)

    const fFin = data.fechaFin || data.fecha_cierre
    if (fFin) updateData.fechaFin = parseFechaLocal(fFin)

    const montoEvidencia = data.valor !== undefined ? Number(data.valor) : (data.puntosOtorgados !== undefined ? Number(data.puntosOtorgados) : undefined)
    if (montoEvidencia !== undefined) {
      updateData.valor = montoEvidencia
    }

    if (data.estado !== undefined) {
      updateData.activa = data.estado === 'Activa'
    } else if (data.activa !== undefined) {
      updateData.activa = data.activa
    } else if (data.activo !== undefined) {
      updateData.activa = data.activo
    }

    await prisma.campana.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Error al actualizar campaña: ${error.message}` }
  }
}

export async function updateCampana(id: number, data: any) {
  return await actualizarCampanaAction(id, data)
}

export async function toggleCampanaEstadoAction(id: number, activa: boolean) {
  try {
    const autorizado = await validarAccionSesion('campanas', 'editar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CAMBIAR EL ESTADO de campañas.' }
    }

    await prisma.campana.update({
      where: { id },
      data: { activa }
    })

    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se pudo actualizar el estado de la campaña.' }
  }
}

export async function eliminarCampanaAction(id: number) {
  try {
    const autorizado = await validarAccionSesion('campanas', 'eliminar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR campañas.' }
    }

    await prisma.campana.delete({
      where: { id }
    })

    revalidatePath('/dashboard/campanas')
    revalidatePath('/dashboard/admin/campanas')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar la campaña porque contiene registros o evidencias asociadas.' }
  }
}

export async function deleteCampana(id: number) {
  return await eliminarCampanaAction(id)
}
export async function getCampanaPublica(id: number) {
  try {
    if (!id || isNaN(id)) {
      return null
    }

    const campana = await prisma.campana.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        valor: true,
        activa: true,
        fechaInicio: true,
        fechaFin: true,
      },
    })

    if (!campana) {
      return null
    }

    return {
      ...campana,
      valor: Number(campana.valor || 0),
    }
  } catch (error) {
    console.error('Error al obtener la campaña pública:', error)
    return null
  }
}
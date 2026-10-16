'use server'

import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { tienePermiso, PermisoModulo } from '@/lib/permisos'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function obtenerUsuarioSesion() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value
    if (!userId) return null

    return await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { role: true }
    })
  } catch (error) {
    return null
  }
}

async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  const usuario = await obtenerUsuarioSesion()
  if (!usuario) return false

  const permisos = (usuario.role?.permisos as unknown as PermisoModulo[]) || []
  const rolNombre = usuario.role?.nombre || usuario.rol

  return tienePermiso(permisos, rolNombre, moduloId, accion)
}

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
    const autorizado = await validarAccionSesion('vendedores', 'ver')
    if (!autorizado) return []

    const vendedoresRaw = await prisma.vendedor.findMany({
      include: {
        evidencias: true 
      }
    })

    const vendedoresProcesados = vendedoresRaw.map((v: any) => {
      const saldoDisponibleReal = Number(v.puntosAcumulados || 0) - Number(v.saldoGastado || 0);
      
      return {
        ...v,
        puntosAcumulados: saldoDisponibleReal,
        evidencias: v.evidencias 
      }
    })
    return vendedoresProcesados.sort((a: any, b: any) => b.puntosAcumulados - a.puntosAcumulados)
  } catch (error) {
    return []
  }
}
export async function crearVendedorAction(data: {
  nombre: string
  cedula: string
  usuarioId?: number
}) {
  try {
    const autorizado = await validarAccionSesion('vendedores', 'crear')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR vendedores.' }
    }

    const cedulaLimpia = data.cedula.trim()
    if (!/^\d{10}$/.test(cedulaLimpia)) {
      return { success: false, error: 'La cédula debe contener exactamente 10 dígitos numéricos.' }
    }

    const partesNombre = data.nombre.trim().split(' ')
    const primerNombre = partesNombre[0] || 'VENDEDOR'
    const primerApellido = partesNombre.slice(1).join(' ') || 'ARAUJO'

    await prisma.vendedor.create({
      data: {
        cedula: cedulaLimpia,
        nombre: primerNombre.toUpperCase(),
        apellido: primerApellido.toUpperCase(),
        puntosAcumulados: 0.00,
        saldoGastado: 0.00,
        activo: true,
        usuarioId: data.usuarioId || undefined
      }
    })

    revalidatePath('/dashboard/vendedores')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Error al crear vendedor: ${error.message}` }
  }
}
export async function actualizarVendedorAction(id: number, data: {
  nombre?: string
  cedula?: string
  activo?: boolean
}) {
  try {
    const autorizado = await validarAccionSesion('vendedores', 'editar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR vendedores.' }
    }

    const updateData: any = {}
    if (data.cedula) {
      const cedulaLimpia = data.cedula.trim()
      if (!/^\d{10}$/.test(cedulaLimpia)) {
        return { success: false, error: 'La cédula debe contener exactamente 10 dígitos numéricos.' }
      }
      updateData.cedula = cedulaLimpia
    }

    if (data.nombre) {
      const partesNombre = data.nombre.trim().split(' ')
      updateData.nombre = (partesNombre[0] || 'VENDEDOR').toUpperCase()
      updateData.apellido = (partesNombre.slice(1).join(' ') || 'ARAUJO').toUpperCase()
    }

    if (data.activo !== undefined) {
      updateData.activo = data.activo
    }

    await prisma.vendedor.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/dashboard/vendedores')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: `Error al actualizar vendedor: ${error.message}` }
  }
}
export async function eliminarVendedorAction(id: number) {
  try {
    const autorizado = await validarAccionSesion('vendedores', 'eliminar')
    if (!autorizado) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR vendedores.' }
    }

    await prisma.vendedor.delete({
      where: { id }
    })

    revalidatePath('/dashboard/vendedores')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar el vendedor porque tiene registros asociados.' }
  }
}
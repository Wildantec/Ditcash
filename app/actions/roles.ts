'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, permissionsAreWithinGrant, userHasPermission } from '@/lib/authorization'

export interface PermisoModulo {
  modulo: string
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

function normalizarPermisos(value: unknown): PermisoModulo[] | null {
  if (!Array.isArray(value)) return null

  const permisos: PermisoModulo[] = []
  const modulos = new Set<string>()
  for (const item of value) {
    if (
      !item ||
      typeof item.modulo !== 'string' ||
      !item.modulo.trim() ||
      ['ver', 'crear', 'editar', 'eliminar'].some((accion) => typeof item[accion] !== 'boolean')
    ) {
      return null
    }
    if (!item.ver && (item.crear || item.editar || item.eliminar)) return null

    const modulo = item.modulo.trim()
    if (modulos.has(modulo)) return null
    modulos.add(modulo)
    permisos.push({
      modulo,
      ver: item.ver,
      crear: item.crear,
      editar: item.editar,
      eliminar: item.eliminar
    })
  }
  return permisos
}

function permisosComoJson(permisos: PermisoModulo[]): Prisma.InputJsonValue {
  return permisos.map(({ modulo, ver, crear, editar, eliminar }) => ({
    modulo,
    ver,
    crear,
    editar,
    eliminar
  }))
}

function esAdministrador(usuario: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return (usuario.role?.nombre || usuario.rol).trim().toUpperCase() === 'ADMIN'
}

export async function obtenerRolesAction() {
  try {
    const usuario = await getCurrentUser()
    if (!userHasPermission(usuario, 'roles', 'ver')) {
      return { success: false, error: 'No tienes permiso para consultar los roles.' }
    }

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { usuarios: true }
        }
      },
      orderBy: { nombre: 'asc' }
    })
    return { success: true, roles }
  } catch (error: any) {
    console.error('Error consultando roles:', error)
    return { success: false, error: 'No se pudieron consultar los roles.' }
  }
}

export async function obtenerRolesParaAsignacionAction() {
  try {
    const usuario = await getCurrentUser()
    if (
      !userHasPermission(usuario, 'usuarios', 'crear') &&
      !userHasPermission(usuario, 'usuarios', 'editar')
    ) {
      return { success: false, error: 'No tienes permiso para consultar los roles asignables.' }
    }

    const roles = await prisma.role.findMany({
      select: { id: true, nombre: true, descripcion: true, permisos: true },
      orderBy: { nombre: 'asc' }
    })
    const administrador = (usuario?.role?.nombre || usuario?.rol || '').trim().toUpperCase() === 'ADMIN'
    const rolesAsignables = administrador
      ? roles
      : roles.filter((rol) =>
          rol.nombre.toUpperCase() !== 'ADMIN' &&
          permissionsAreWithinGrant(rol.permisos, usuario?.role?.permisos)
        )
    return {
      success: true,
      roles: rolesAsignables.map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }))
    }
  } catch (error) {
    console.error('Error consultando roles asignables:', error)
    return { success: false, error: 'No se pudieron consultar los roles asignables.' }
  }
}

export async function guardarRolAction(data: {
  id?: number
  nombre: string
  descripcion?: string
  permisos: PermisoModulo[]
}) {
  try {
    const usuario = await getCurrentUser()
    const accion = data.id ? 'editar' : 'crear'
    if (!userHasPermission(usuario, 'roles', accion)) {
      return { success: false, error: `No tienes permiso para ${accion} roles.` }
    }

    const nombreUpper = data.nombre.trim().toUpperCase()
    const permisos = normalizarPermisos(data.permisos)
    if (!nombreUpper || nombreUpper.length > 80 || !permisos) {
      return { success: false, error: 'El nombre o la matriz de permisos no es válida.' }
    }
    if (nombreUpper === 'ADMIN') {
      return { success: false, error: 'El rol ADMIN está reservado y no se puede crear ni renombrar.' }
    }

    const administrador = usuario ? esAdministrador(usuario) : false
    if (!administrador && !permissionsAreWithinGrant(permisos, usuario?.role?.permisos as PermisoModulo[] | null)) {
      return { success: false, error: 'No puedes otorgar permisos que tu propio rol no tiene.' }
    }

    const descripcion = data.descripcion?.trim() || null
    if (data.id) {
      const rolActual = await prisma.role.findUnique({ where: { id: Number(data.id) } })
      if (!rolActual) return { success: false, error: 'El rol que intentas editar ya no existe.' }
      if (rolActual.nombre.toUpperCase() === 'ADMIN') {
        return { success: false, error: 'El rol ADMIN está protegido y no se puede modificar.' }
      }

      const rolConNombre = await prisma.role.findUnique({ where: { nombre: nombreUpper } })
      if (rolConNombre && rolConNombre.id !== rolActual.id) {
        return { success: false, error: `Ya existe el rol "${nombreUpper}".` }
      }

      await prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id: rolActual.id },
          data: {
            nombre: nombreUpper,
            descripcion,
            permisos: permisosComoJson(permisos)
          }
        })
        if (rolActual.nombre !== nombreUpper) {
          await tx.user.updateMany({
            where: { roleId: rolActual.id },
            data: { rol: nombreUpper }
          })
        }
      })
    } else {
      const existe = await prisma.role.findUnique({ where: { nombre: nombreUpper } })
      if (existe) {
        return { success: false, error: `Ya existe el rol "${nombreUpper}".` }
      }

      await prisma.role.create({
        data: {
          nombre: nombreUpper,
          descripcion,
          permisos: permisosComoJson(permisos)
        }
      })
    }

    revalidatePath('/dashboard/permisos')
    revalidatePath('/dashboard/configuracion/roles')
    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Error guardando rol:', error)
    return { success: false, error: 'No se pudo guardar el rol.' }
  }
}

export async function eliminarRolAction(id: number) {
  try {
    const usuario = await getCurrentUser()
    if (!userHasPermission(usuario, 'roles', 'eliminar')) {
      return { success: false, error: 'No tienes permiso para eliminar roles.' }
    }

    const rol = await prisma.role.findUnique({ where: { id: Number(id) } })
    if (!rol) return { success: false, error: 'El rol seleccionado no existe.' }
    if (rol.nombre.toUpperCase() === 'ADMIN') {
      return { success: false, error: 'El rol ADMIN está protegido y no se puede eliminar.' }
    }

    const usuariosConRol = await prisma.user.count({
      where: { OR: [{ roleId: rol.id }, { rol: rol.nombre }] }
    })
    if (usuariosConRol > 0) {
      return {
        success: false,
        error: `No se puede eliminar el rol porque está asignado a ${usuariosConRol} usuario(s).`
      }
    }

    await prisma.role.delete({ where: { id: rol.id } })
    revalidatePath('/dashboard/permisos')
    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Error eliminando rol:', error)
    return { success: false, error: 'No se pudo eliminar el rol.' }
  }
}

export async function asignarRolAUsuarioAction(userId: number, roleId: number) {
  try {
    const usuario = await getCurrentUser()
    if (!userHasPermission(usuario, 'usuarios', 'editar')) {
      return { success: false, error: 'No tienes permiso para cambiar roles de usuarios.' }
    }

    const [rol, usuarioObjetivo] = await Promise.all([
      prisma.role.findUnique({ where: { id: Number(roleId) } }),
      prisma.user.findUnique({ where: { id: Number(userId) }, include: { role: true } })
    ])
    if (!rol) return { success: false, error: 'El rol seleccionado no existe.' }
    if (!usuarioObjetivo) return { success: false, error: 'El usuario seleccionado no existe.' }
    if (
      (usuarioObjetivo.role?.nombre || usuarioObjetivo.rol).trim().toUpperCase() === 'ADMIN' &&
      !esAdministrador(usuario!)
    ) {
      return { success: false, error: 'Solo un administrador puede modificar una cuenta ADMIN.' }
    }
    if (rol.nombre.toUpperCase() === 'ADMIN' && !esAdministrador(usuario!)) {
      return { success: false, error: 'Solo un administrador puede asignar el rol ADMIN.' }
    }
    if (
      !esAdministrador(usuario!) &&
      !permissionsAreWithinGrant(rol.permisos, usuario?.role?.permisos)
    ) {
      return { success: false, error: 'No puedes asignar un rol con más permisos que los que tienes.' }
    }

    await prisma.user.update({
      where: { id: Number(userId) },
      data: { roleId: rol.id, rol: rol.nombre }
    })

    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error: any) {
    console.error('Error asignando rol:', error)
    return { success: false, error: 'No se pudo asignar el rol.' }
  }
}

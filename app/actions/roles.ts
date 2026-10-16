'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface PermisoModulo {
  modulo: string
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

export async function obtenerRolesAction() {
  try {
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
    return { success: false, error: error.message }
  }
}

export async function guardarRolAction(data: {
  id?: number
  nombre: string
  descripcion?: string
  permisos: PermisoModulo[]
}) {
  try {
    const nombreUpper = data.nombre.toUpperCase().trim()

    if (data.id) {
      await prisma.role.update({
        where: { id: Number(data.id) },
        data: {
          nombre: nombreUpper,
          descripcion: data.descripcion?.trim() || null,
          permisos: data.permisos as any
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
          descripcion: data.descripcion?.trim() || null,
          permisos: data.permisos as any
        }
      })
    }

    revalidatePath('/dashboard/permisos')
    revalidatePath('/dashboard/configuracion/roles')
    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function eliminarRolAction(id: number) {
  try {
    const usuariosConRol = await prisma.user.count({ 
      where: { roleId: Number(id) } 
    })

    if (usuariosConRol > 0) {
      return { 
        success: false, 
        error: `No se puede eliminar el rol porque está asignado a ${usuariosConRol} usuario(s).` 
      }
    }

    await prisma.role.delete({ 
      where: { id: Number(id) } 
    })

    revalidatePath('/dashboard/permisos')
    revalidatePath('/dashboard/usuarios')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
export async function asignarRolAUsuarioAction(userId: number, roleId: number) {
  try {
    const rol = await prisma.role.findUnique({ where: { id: Number(roleId) } })
    if (!rol) return { success: false, error: 'El rol seleccionado no existe.' }

    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        roleId: Number(roleId),
        rol: rol.nombre
      }
    })

    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
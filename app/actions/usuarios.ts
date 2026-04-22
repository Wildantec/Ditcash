'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 1. OBTENER TODOS LOS USUARIOS (Limpiando Decimales)
export async function getUsuariosAction() {
  try {
    const usuarios = await prisma.user.findMany({
      include: {
        vendedor: true
      },
      orderBy: {
        id: 'desc'
      }
    })

    const usuariosLimpios = usuarios.map(u => ({
      ...u,
      vendedor: u.vendedor ? {
        ...u.vendedor,
        puntosAcumulados: u.vendedor.puntosAcumulados ? Number(u.vendedor.puntosAcumulados) : 0
      } : null
    }))

    return usuariosLimpios
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

// 2. OBTENER UN USUARIO POR ID (Para la página de editar)
export async function getUsuarioByIdAction(id: number) {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: { vendedor: true }
    });

    if (!usuario) return null;

    return {
      ...usuario,
      vendedor: usuario.vendedor ? {
        ...usuario.vendedor,
        puntosAcumulados: usuario.vendedor.puntosAcumulados ? Number(usuario.vendedor.puntosAcumulados) : 0
      } : null
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 3. ACTUALIZAR USUARIO
export async function actualizarUsuarioAction(id: number, data: any) {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        cedula: data.cedula,
        rol: data.rol,
        activo: data.activo,
        vendedor: {
          update: {
            nombre: data.nombre
          }
        }
      }
    })
    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'No se pudo actualizar los datos' }
  }
}

// 4. ELIMINAR UN USUARIO
export async function eliminarUsuarioAction(id: number) {
  try {
    await prisma.user.delete({
      where: { id }
    })
    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return { success: false, error: 'No se puede eliminar porque tiene registros asociados' }
  }
}
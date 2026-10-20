'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { getCurrentUser, permissionsAreWithinGrant, userHasPermission } from '@/lib/authorization'

export async function getCurrentUserAccessAction() {
  const usuario = await getCurrentUser()
  if (!usuario) return null
  return {
    id: usuario.id,
    rol: usuario.rol,
    role: usuario.role
      ? {
          id: usuario.role.id,
          nombre: usuario.role.nombre,
          permisos: usuario.role.permisos
        }
      : null
  }
}

async function obtenerTokenAraujo(): Promise<string | null> {
  try {
    const apiUrl = process.env.API_CONTABLE_URL || "https://grupoaraujos.cloud";
    const email = process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com";
    const password = process.env.API_CONTABLE_PASSWORD || "admin123";

    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      next: { revalidate: 0 }
    });

    if (!res.ok) return null;
    const datos = await res.json();
    return datos.token || datos.accessToken || null;
  } catch (error) {
    return null;
  }
}

async function verificarVendedorEnAraujo(cedula: string, token: string): Promise<{ existe: boolean; nombre?: string; apellido?: string }> {
  try {
    const apiUrl = process.env.API_CONTABLE_URL || "https://grupoaraujos.cloud";
    const res = await fetch(`${apiUrl}/api/vendedores/verificar/${cedula}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) return { existe: false };
    const datos = await res.json();
    if (datos && (datos.existe || datos.id)) {
      return {
        existe: true,
        nombre: datos.nombre || 'VENDEDOR',
        apellido: datos.apellido || 'ARAUJO'
      };
    }

    return { existe: false };
  } catch (error) {
    return { existe: false };
  }
}

export async function crearUsuarioAction(data: {
  username: string
  cedula: string
  nombreCompleto: string
  password: string
  rol: string
  roleId: number
}) {
  try {
    const usuarioEjecutor = await getCurrentUser()
    if (!userHasPermission(usuarioEjecutor, 'usuarios', 'crear')) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR usuarios.' }
    }

    const rolAsignado = await prisma.role.findUnique({ where: { id: Number(data.roleId) } })
    if (!rolAsignado) return { success: false, error: 'El rol seleccionado no existe.' }
    if (typeof data.password !== 'string' || data.password.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
    }
    const esAdmin = (usuarioEjecutor?.role?.nombre || usuarioEjecutor?.rol || '').trim().toUpperCase() === 'ADMIN'
    if (rolAsignado.nombre.toUpperCase() === 'ADMIN' && !esAdmin) {
      return { success: false, error: 'Solo un administrador puede asignar el rol ADMIN.' }
    }
    if (
      !esAdmin &&
      !permissionsAreWithinGrant(
        rolAsignado.permisos,
        usuarioEjecutor?.role?.permisos
      )
    ) {
      return { success: false, error: 'No puedes asignar un rol con más permisos que los que tienes.' }
    }

    const cedulaLimpia = data.cedula.trim();
    const usernameLimpio = data.username.trim();
    const regexCedula = /^\d{10}$/;
    if (!regexCedula.test(cedulaLimpia)) {
      return { 
        success: false, 
        error: 'No se puede crear el usuario: El número de cédula debe contener exactamente 10 dígitos numéricos.' 
      };
    }
    
    const usuarioExistente = await prisma.user.findFirst({
      where: { OR: [{ username: usernameLimpio }, { cedula: cedulaLimpia }] }
    });

    if (usuarioExistente) {
      return { success: false, error: 'El nombre de usuario o número de cédula ya se encuentra registrado en DITCASH.' };
    }

    const rolNombre = rolAsignado.nombre
    if (rolNombre === 'VENDEDOR') {
      const tokenAraujo = await obtenerTokenAraujo();
      if (!tokenAraujo) {
        return { success: false, error: 'Servicio Contable Araujo no disponible temporalmente. Intente más tarde.' };
      }

      const validacionAraujo = await verificarVendedorEnAraujo(cedulaLimpia, tokenAraujo);
      
      if (!validacionAraujo.existe) {
        return { 
          success: false, 
          error: `RECHAZADO: La cédula ${cedulaLimpia} no existe como vendedor activo en el Sistema Contable Araujo.` 
        };
      }
      if (validacionAraujo.nombre) {
        data.nombreCompleto = `${validacionAraujo.nombre} ${validacionAraujo.apellido || ''}`.trim().toUpperCase();
      }
    }

    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(data.password, 12)
      const nuevoUsuario = await tx.user.create({
        data: {
          username: usernameLimpio,
          cedula: cedulaLimpia,
          password: passwordHash,
          nombre: data.nombreCompleto.toUpperCase(),
          rol: rolNombre,
          roleId: rolAsignado.id,
          estado: 'Activo',
          activo: true
        }
      })

      if (rolNombre === 'VENDEDOR') {
        const partesNombre = data.nombreCompleto.split(' ')
        const primerNombre = partesNombre[0] || 'VENDEDOR'
        const primerApellido = partesNombre.slice(1).join(' ') || 'ARAUJO'

        await tx.vendedor.create({
          data: {
            cedula: cedulaLimpia,
            nombre: primerNombre.toUpperCase(),
            apellido: primerApellido.toUpperCase(),
            puntosAcumulados: 0.00,
            saldoGastado: 0.00,
            activo: true,
            usuarioId: nuevoUsuario.id
          }
        })
      }
    })

    revalidatePath('/dashboard/admin/usuarios');
    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Error en el servidor: ${error.message}` };
  }
}

export async function getUsuariosAction() {
  try {
    const usuario = await getCurrentUser()
    if (!userHasPermission(usuario, 'usuarios', 'ver')) {
      throw new Error('Acceso Denegado: Tu rol no tiene permisos para consultar usuarios.')
    }

    const usuarios = await prisma.user.findMany({
      include: {
        vendedor: true,
        role: true
      },
      orderBy: {
        id: 'desc'
      }
    })
    
    return usuarios.map((u) => ({
      id: u.id,
      username: u.username,
      cedula: u.cedula,
      nombre: u.nombre,
      rol: u.rol,
      roleId: u.roleId,
      role: u.role,
      estado: u.estado,
      activo: u.activo,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      vendedor: u.vendedor ? {
        ...u.vendedor,
        puntosAcumulados: Number(u.vendedor.puntosAcumulados),
        saldoGastado: Number(u.vendedor.saldoGastado)
      } : null
    }))
  } catch (error) {
    console.error('Error consultando usuarios:', error)
    throw error
  }
}

export async function getUsuarioByIdAction(id: number) {
  try {
    const usuarioActual = await getCurrentUser()
    if (
      !userHasPermission(usuarioActual, 'usuarios', 'ver') &&
      !userHasPermission(usuarioActual, 'usuarios', 'editar')
    ) {
      throw new Error('Acceso Denegado: Tu rol no puede consultar este usuario.')
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
      include: { 
        vendedor: true,
        role: true 
      }
    });

    if (!usuario) return null;

    return {
      id: usuario.id,
      username: usuario.username,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      rol: usuario.rol,
      roleId: usuario.roleId,
      role: usuario.role,
      estado: usuario.estado,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
      vendedor: usuario.vendedor ? {
        ...usuario.vendedor,
        puntosAcumulados: Number(usuario.vendedor.puntosAcumulados),
        saldoGastado: Number(usuario.vendedor.saldoGastado)
      } : null
    };
  } catch (error) {
    console.error('Error consultando usuario:', error)
    throw error
  }
}

export async function actualizarUsuarioAction(id: number, data: any) {
  try {
    const usuarioEjecutor = await getCurrentUser()
    if (!userHasPermission(usuarioEjecutor, 'usuarios', 'editar')) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR usuarios.' }
    }

    const cedulaLimpia = data.cedula ? String(data.cedula).trim() : '';
    if (cedulaLimpia) {
      const regexCedula = /^\d{10}$/;
      if (!regexCedula.test(cedulaLimpia)) {
        return { 
          success: false, 
          error: 'No se puede actualizar: El número de cédula debe contener exactamente 10 dígitos numéricos.' 
        };
      }
    }

    const usuarioConVendedor = await prisma.user.findUnique({
      where: { id },
      include: { vendedor: true, role: true }
    });
    if (!usuarioConVendedor) return { success: false, error: 'El usuario seleccionado no existe.' }

    const esAdmin = (usuarioEjecutor?.role?.nombre || usuarioEjecutor?.rol || '').trim().toUpperCase() === 'ADMIN'
    if ((usuarioConVendedor.role?.nombre || usuarioConVendedor.rol).trim().toUpperCase() === 'ADMIN' && !esAdmin) {
      return { success: false, error: 'Solo un administrador puede modificar una cuenta ADMIN.' }
    }

    let rolAsignado = null
    if (data.roleId !== undefined && data.roleId !== null) {
      rolAsignado = await prisma.role.findUnique({ where: { id: Number(data.roleId) } })
      if (!rolAsignado) return { success: false, error: 'El rol seleccionado no existe.' }
      if (rolAsignado.nombre.toUpperCase() === 'ADMIN' && !esAdmin) {
        return { success: false, error: 'Solo un administrador puede asignar el rol ADMIN.' }
      }
      if (
        !esAdmin &&
        !permissionsAreWithinGrant(
          rolAsignado.permisos,
          usuarioEjecutor?.role?.permisos
        )
      ) {
        return { success: false, error: 'No puedes asignar un rol con más permisos que los que tienes.' }
      }
    }
    if (data.roleId === null) {
      return { success: false, error: 'El usuario debe tener un rol asignado.' }
    }
    const updateData: any = {
      cedula: cedulaLimpia || undefined,
      rol: rolAsignado?.nombre,
      roleId: rolAsignado?.id,
      activo: data.activo,
      nombre: data.nombre ? data.nombre.toUpperCase() : undefined
    };

    if (usuarioConVendedor?.vendedor) {
      updateData.vendedor = {
        update: {
          nombre: data.nombre ? data.nombre.toUpperCase() : undefined,
          cedula: cedulaLimpia || undefined
        }
      };
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/dashboard/admin/usuarios');
    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Error de actualización: ${error.message || 'Restricción de base de datos.'}` };
  }
}

export async function eliminarUsuarioAction(id: number) {
  try {
    const usuarioEjecutor = await getCurrentUser()
    if (!userHasPermission(usuarioEjecutor, 'usuarios', 'eliminar')) {
      return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR usuarios.' }
    }

    const objetivo = await prisma.user.findUnique({ where: { id }, include: { role: true } })
    if (!objetivo) return { success: false, error: 'El usuario seleccionado no existe.' }
    const esAdmin = (usuarioEjecutor?.role?.nombre || usuarioEjecutor?.rol || '').trim().toUpperCase() === 'ADMIN'
    if (objetivo.id === usuarioEjecutor?.id) return { success: false, error: 'No puedes eliminar tu propia cuenta.' }
    if ((objetivo.role?.nombre || objetivo.rol).trim().toUpperCase() === 'ADMIN' && !esAdmin) {
      return { success: false, error: 'Solo un administrador puede eliminar una cuenta ADMIN.' }
    }

    await prisma.user.delete({
      where: { id }
    })
    revalidatePath('/dashboard/admin/usuarios')
    revalidatePath('/dashboard/usuarios')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se puede eliminar porque tiene registros asociados' }
  }
}
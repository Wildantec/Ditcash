'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { tienePermiso, PermisoModulo } from '@/lib/permisos'

async function validarPermisoUsuarioActual(usuarioEjecutorId: number, moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  if (!usuarioEjecutorId) return true

  const usuario = await prisma.user.findUnique({
    where: { id: usuarioEjecutorId },
    include: { role: true }
  })

  if (!usuario) return false

  const permisosObj = (usuario.role?.permisos as unknown as PermisoModulo[]) || []
  return tienePermiso(permisosObj, usuario.role?.nombre || usuario.rol, moduloId, accion)
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
  rol: string
  roleId?: number
  usuarioEjecutorId?: number
}) {
  try {
    if (data.usuarioEjecutorId) {
      const autorizado = await validarPermisoUsuarioActual(data.usuarioEjecutorId, 'usuarios', 'crear');
      if (!autorizado) {
        return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR usuarios.' };
      }
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

    if (data.rol === 'VENDEDOR') {
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

    const nuevoUsuario = await prisma.user.create({
      data: {
        username: usernameLimpio,
        cedula: cedulaLimpia,
        password: 'DITCASH_DEFAULT_KEY_123',
        nombre: data.nombreCompleto.toUpperCase(),
        rol: data.rol.toUpperCase(),
        roleId: data.roleId ? Number(data.roleId) : undefined,
        estado: 'Activo',
        activo: true
      }
    });

    if (data.rol === 'VENDEDOR') {
      const partesNombre = data.nombreCompleto.split(' ');
      const primerNombre = partesNombre[0] || 'VENDEDOR';
      const primerApellido = partesNombre.slice(1).join(' ') || 'ARAUJO';

      await prisma.vendedor.create({
        data: {
          cedula: cedulaLimpia,
          nombre: primerNombre.toUpperCase(),
          apellido: primerApellido.toUpperCase(),
          puntosAcumulados: 0.00,
          saldoGastado: 0.00,
          activo: true,
          usuarioId: nuevoUsuario.id
        }
      });
    }

    revalidatePath('/dashboard/admin/usuarios');
    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Error en el servidor: ${error.message}` };
  }
}

export async function getUsuariosAction() {
  try {
    const usuarios = await prisma.user.findMany({
      include: {
        vendedor: true,
        role: true
      },
      orderBy: {
        id: 'desc'
      }
    })
    
    return usuarios.map((u: any) => ({
      ...u,
      vendedor: u.vendedor ? {
        ...u.vendedor,
        puntosAcumulados: u.vendedor.puntosAcumulados ? Number(u.vendedor.puntosAcumulados) : 0
      } : null
    }))
  } catch (error) {
    return []
  }
}

export async function getUsuarioByIdAction(id: number) {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: { 
        vendedor: true,
        role: true 
      }
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
    return null;
  }
}

export async function actualizarUsuarioAction(id: number, data: any, usuarioEjecutorId?: number) {
  try {
    if (usuarioEjecutorId) {
      const autorizado = await validarPermisoUsuarioActual(usuarioEjecutorId, 'usuarios', 'editar');
      if (!autorizado) {
        return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR usuarios.' };
      }
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
      include: { vendedor: true }
    });

    const updateData: any = {
      cedula: cedulaLimpia || undefined,
      rol: data.rol ? data.rol.toUpperCase() : undefined,
      roleId: data.roleId ? Number(data.roleId) : undefined,
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

export async function eliminarUsuarioAction(id: number, usuarioEjecutorId?: number) {
  try {
    if (usuarioEjecutorId) {
      const autorizado = await validarPermisoUsuarioActual(usuarioEjecutorId, 'usuarios', 'eliminar');
      if (!autorizado) {
        return { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR usuarios.' };
      }
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
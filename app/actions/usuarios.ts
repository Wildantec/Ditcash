'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
}) {
  try {
    const cedulaLimpia = data.cedula.trim();
    const usernameLimpio = data.username.trim();
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
        rol: data.rol,
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
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Error en el servidor: ${error.message}` };
  }
}
export async function getUsuariosAction() {
  try {
    const usuarios = await prisma.user.findMany({
      where: {
        rol: { in: ['ADMIN', 'VENDEDOR', 'MARKETING'] }
      },
      include: {
        vendedor: true
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
    return null;
  }
}

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
            nombre: data.nombre.toUpperCase()
          }
        }
      }
    })
    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se pudo actualizar los datos' }
  }
}

export async function eliminarUsuarioAction(id: number) {
  try {
    await prisma.user.delete({
      where: { id }
    })
    revalidatePath('/dashboard/admin/usuarios')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'No se puede eliminar porque tiene registros asociados' }
  }
}
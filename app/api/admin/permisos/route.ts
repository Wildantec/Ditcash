import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { tienePermiso, PermisoModulo } from '@/lib/permisos';

export const dynamic = 'force-dynamic';

const dataDir = path.join(process.cwd(), 'data');
const rutaArchivo = path.join(dataDir, 'permisos.json');

// Helper interno para validar la sesión y permisos usando cookies
async function validarAccionSesion(moduloId: string, accion: 'ver' | 'crear' | 'editar' | 'eliminar') {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return false;

    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { role: true }
    });

    if (!usuario) return false;

    const permisos = (usuario.role?.permisos as unknown as PermisoModulo[]) || [];
    const rolNombre = usuario.role?.nombre || usuario.rol;

    return tienePermiso(permisos, rolNombre, moduloId, accion);
  } catch (error) {
    return false;
  }
}

const inicializarArchivo = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(rutaArchivo)) {
      fs.writeFileSync(rutaArchivo, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error inicializando permisos:', err);
  }
};

// 🛡️ GET: Obtener la matriz de permisos guardada
export async function GET() {
  try {
    const autorizado = await validarAccionSesion('usuarios', 'ver') || await validarAccionSesion('roles', 'ver');
    if (!autorizado) {
      return NextResponse.json(
        { success: false, message: 'Acceso Denegado: Tu rol no tiene permisos para consultar la matriz de permisos.' },
        { status: 403 }
      );
    }

    inicializarArchivo();
    if (!fs.existsSync(rutaArchivo)) {
      return NextResponse.json({ success: true, data: [] });
    }
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const datos = contenido ? JSON.parse(contenido) : [];
    return NextResponse.json({ success: true, data: datos });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 🛡️ POST: Guardar o actualizar la matriz de permisos de un rol
export async function POST(request: Request) {
  try {
    const autorizado = await validarAccionSesion('usuarios', 'editar') || await validarAccionSesion('roles', 'editar');
    if (!autorizado) {
      return NextResponse.json(
        { success: false, message: 'Acceso Denegado: Tu rol no tiene permisos para MODIFICAR la matriz de permisos.' },
        { status: 403 }
      );
    }

    inicializarArchivo();
    const body = await request.json();
    
    const { rol, permisos } = body;

    if (!rol || !Array.isArray(permisos)) {
      return NextResponse.json({ success: false, message: 'Formato de matriz de permisos inválido' }, { status: 400 });
    }

    let listaPermisosExistentes = [];
    if (fs.existsSync(rutaArchivo)) {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
      listaPermisosExistentes = contenido ? JSON.parse(contenido) : [];
    }

    let nuevaLista = listaPermisosExistentes.filter((p: any) => p.role !== rol && p.rol !== rol);

    permisos.forEach((perm: any) => {
      nuevaLista.push({
        rol: rol,
        modulo: perm.modulo,
        ver: !!perm.ver,
        crear: !!perm.crear,
        editar: !!perm.editar,
        eliminar: !!perm.eliminar
      });
    });

    fs.writeFileSync(rutaArchivo, JSON.stringify(nuevaLista, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Matriz de control guardada con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
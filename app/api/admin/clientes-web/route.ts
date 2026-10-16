import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { tienePermiso, PermisoModulo } from '@/lib/permisos';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  try {
    const autorizado = await validarAccionSesion('clientes', 'ver') || await validarAccionSesion('vendedores', 'ver');
    if (!autorizado) {
      return NextResponse.json(
        { success: false, message: 'Acceso Denegado: Tu rol no tiene permisos para ver clientes web.' },
        { status: 403 }
      );
    }

    const clientes = await prisma.clienteWeb.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: clientes });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modificados, eliminadosIds } = body;
    if (eliminadosIds && eliminadosIds.length > 0) {
      const puedeEliminar = await validarAccionSesion('clientes', 'eliminar');
      if (!puedeEliminar) {
        return NextResponse.json(
          { success: false, message: 'Acceso Denegado: Tu rol no tiene permisos para ELIMINAR clientes web.' },
          { status: 403 }
        );
      }
    }
    if (modificados && modificados.length > 0) {
      const puedeEditar = await validarAccionSesion('clientes', 'editar');
      if (!puedeEditar) {
        return NextResponse.json(
          { success: false, message: 'Acceso Denegado: Tu rol no tiene permisos para EDITAR clientes web.' },
          { status: 403 }
        );
      }
    }

    await prisma.$transaction([
      ...(eliminadosIds && eliminadosIds.length > 0 
        ? [prisma.clienteWeb.deleteMany({ where: { id: { in: eliminadosIds } } })] 
        : []),
      ...(modificados && modificados.length > 0
        ? modificados.map((cli: any) => 
            prisma.clienteWeb.update({
              where: { id: Number(cli.id) },
              data: {
                cedula: cli.cedula,
                nombre: cli.nombre,
                activo: Boolean(cli.activo),
                ...(cli.password && cli.password.trim() !== "" ? { password: cli.password } : {})
              }
            })
          )
        : [])
    ]);

    return NextResponse.json({ success: true, message: 'Base de datos sincronizada con éxito' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
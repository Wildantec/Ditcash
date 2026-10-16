import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { tienePermiso, PermisoModulo } from '@/lib/permisos'

export const dynamic = 'force-dynamic'
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

export async function POST(req: Request) {
  try {
    const autorizado = await validarAccionSesion('usuarios', 'crear')
    if (!autorizado) {
      return NextResponse.json(
        { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR vendedores.' },
        { status: 403 }
      )
    }

    const body = await req.json()

    if (!body.cedula || !body.password || !body.nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    await prisma.$transaction(async (tx: any) => {
      const nuevoUsuario = await tx.user.create({
        data: {
          username: body.cedula,
          cedula: body.cedula,
          password: hashedPassword,
          nombre: body.nombre,
          rol: 'VENDEDOR',
          estado: 'Activo',
          activo: true
        }
      })

      await tx.vendedor.create({
        data: {
          usuarioId: nuevoUsuario.id,
          nombre: body.nombre,
          cedula: body.cedula,
          puntosAcumulados: 0
        }
      })
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Esta cédula (o usuario) ya está registrada" }, { status: 400 })
    }

    return NextResponse.json({ error: "Error de servidor" }, { status: 500 })
  }
}
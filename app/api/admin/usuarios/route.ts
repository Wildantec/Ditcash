import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
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
        { success: false, error: 'Acceso Denegado: Tu rol no tiene permisos para CREAR usuarios.' },
        { status: 403 }
      )
    }

    const { nombre, cedula, password, rol, roleId } = await req.json()

    if (!cedula || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          username: cedula,
          cedula,
          password: hashedPassword,
          nombre,
          rol: rol || 'VENDEDOR',
          ...(roleId ? { roleId: Number(roleId) } : {})
        },
      })

      if (rol === 'VENDEDOR') {
        await tx.vendedor.create({
          data: {
            cedula,
            nombre,
            puntosAcumulados: 0,
            usuarioId: newUser.id,
          },
        })
      }
      return newUser
    })

    return NextResponse.json({ success: true, user: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear el usuario' }, { status: 500 })
  }
}